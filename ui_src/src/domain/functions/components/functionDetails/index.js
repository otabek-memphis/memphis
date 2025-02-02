// Copyright 2022-2023 The Memphis.dev Authors
// Licensed under the Memphis Business Source License 1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// Changed License: [Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0), as published by the Apache Foundation.
//
// https://github.com/memphisdev/memphis/blob/master/LICENSE
//
// Additional Use Grant: You may make use of the Licensed Work (i) only as part of your own product or service, provided it is not a message broker or a message queue product or service; and (ii) provided that you do not use, provide, distribute, or make available the Licensed Work as a Service.
// A "Service" is a commercial offering, product, hosted, or managed service, that allows third parties (other than your own employees and contractors acting on your behalf) to access and/or use the Licensed Work or a substantial set of the features or functionality of the Licensed Work to third parties as a software-as-a-service, platform-as-a-service, infrastructure-as-a-service or other similar services that compete with Licensor products or services.

import './style.scss';
import React, { useEffect, useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import emoji from 'emoji-dictionary';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { FiGitCommit } from 'react-icons/fi';
import { BiDownload } from 'react-icons/bi';
import { GoFileDirectoryFill } from 'react-icons/go';
import { Divider, Rate } from 'antd';
import { ReactComponent as CollapseArrowIcon } from '../../../../assets/images/collapseArrow.svg';
import Button from '../../../../components/button';
import TagsList from '../../../../components/tagList';
import Spinner from '../../../../components/spinner';
import { parsingDate } from '../../../../services/valueConvertor';
import { ReactComponent as MemphisFunctionIcon } from '../../../../assets/images/memphisFunctionIcon.svg';
import { ReactComponent as FunctionIcon } from '../../../../assets/images/functionIcon.svg';
import { ReactComponent as CodeBlackIcon } from '../../../../assets/images/codeIconBlack.svg';
import { ReactComponent as GithubBranchIcon } from '../../../../assets/images/githubBranchIcon.svg';
import { ReactComponent as PlaceholderFunctionsIcon } from '../../../../assets/images/placeholderFunctions.svg';
import { ReactComponent as ArrowBackIcon } from '../../../../assets/images/arrowBackIcon.svg';
import { ReactComponent as DeleteIcon } from '../../../../assets/images/deleteIcon.svg';
import CustomTabs from '../../../../components/Tabs';
import SelectComponent from '../../../../components/select';
import CloudModal from '../../../../components/cloudModal';
import TestMockEvent from '../testFunctionModal/components/testMockEvent';
import Tooltip from '../../../../components/tooltip/tooltip';
import { OWNER } from '../../../../const/globalConst';
import { BsFileEarmarkCode, BsGit } from 'react-icons/bs';
import { GoRepo } from 'react-icons/go';
import { RxDotFilled } from 'react-icons/rx';
import { FaArrowCircleUp } from 'react-icons/fa';
import { Tree } from 'antd';
import { httpRequest } from '../../../../services/http';
import { ApiEndpoints } from '../../../../const/apiEndpoints';
import { getCodingLanguage } from '../../../../utils/languages';
import OverflowTip from '../../../../components/tooltip/overflowtip';
import { isCloud } from '../../../../services/valueConvertor';
import { Context } from '../../../../hooks/store';

loader.init();
loader.config({ monaco });

function FunctionDetails({ selectedFunction, handleInstall, handleUnInstall, clickApply, onBackToFunction = null, stationView }) {
    const [state, dispatch] = useContext(Context);
    const [tabValue, setTabValue] = useState('Details');
    const [isTestFunctionModalOpen, setIsTestFunctionModalOpen] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState('latest');
    const [metaData, setMetaData] = useState({});
    const [readme, setReadme] = useState();
    const [versions, setVersions] = useState([]);
    const [files, setFiles] = useState([]);
    const [fileContent, setFileContent] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [isFileContentLoading, setIsFileContentLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openUpgradeModal, setOpenUpgradeModal] = useState(false);
    const [path, setPath] = useState(null);

    const emojiSupport = (text) => text?.replace(/:\w+:/gi, (name) => emoji?.getUnicode(name));
    const formattedMarkdownContent = (text) => text.replace((/`/g, '\\`'));

    useEffect(() => {
        getFunctionDetails();
    }, [selectedFunction, selectedVersion]);

    useEffect(() => {
        if (path) {
            setFileContent('');
            getFileContent(path);
        }
    }, [selectedVersion]);

    useEffect(() => {
        if (tabValue === 'Details') {
            setFileContent(null);
            setPath(null);
        }
    }, [tabValue]);

    useEffect(() => {
        buildTree(files);
    }, [files]);

    const getFunctionDetails = async () => {
        setLoading(true);
        try {
            const response = await httpRequest(
                'GET',
                ApiEndpoints.GET_FUNCTION_DETAIL +
                    '?repo=' +
                    encodeURI(selectedFunction?.repo) +
                    '&branch=' +
                    encodeURI(selectedFunction?.branch) +
                    '&owner=' +
                    encodeURI(selectedFunction?.owner) +
                    '&scm=' +
                    encodeURI(selectedFunction?.scm) +
                    '&function_name=' +
                    encodeURI(selectedFunction?.function_name || selectedFunction?.name) +
                    '&version=' +
                    encodeURI(selectedVersion === 'latest' ? '' : selectedVersion)
            );
            setMetaData(response?.metadata_function);
            setReadme(response?.readme_content);
            setVersions(response?.versions);
            setFiles([...response?.s3_object_keys] || []);
            setLoading(false);
        } catch (e) {
            setLoading(false);
            return;
        }
    };

    const renderNoFunctionDetails = (
        <div className="no-function-to-display">
            <PlaceholderFunctionsIcon width={150} alt="placeholderFunctions" />
            <p className="title">There is no available Reamde file</p>
        </div>
    );

    const buildTree = (files) => {
        files = files?.sort((a, b) => a.localeCompare(b));
        let tree = [];
        let root = {};
        files?.forEach((filePath, index) => {
            const pathParts = filePath.split('/');
            if (pathParts.length === 1) {
                root = {
                    title: pathParts[0],
                    key: `index-${index}`,
                    icon: <GoFileDirectoryFill style={{ color: '#B9DAF0' }} />,
                    children: []
                };
                tree.push(root);
            } else {
                let parent = root;
                for (let i = 1; i < pathParts.length; i++) {
                    let found = false;
                    for (let j = 0; j < parent.children?.length; j++) {
                        if (parent.children[j].title === pathParts[i]) {
                            parent = parent.children[j];
                            found = true;
                            break;
                        }
                    }
                    if (!found && i < pathParts.length - 1) {
                        const newChild = {
                            title: pathParts[i],
                            key: index + '-' + i,
                            icon: <GoFileDirectoryFill style={{ color: '#B9DAF0' }} />,
                            children: []
                        };
                        parent.children.push(newChild);
                        parent = newChild;
                    }
                    if (i === pathParts.length - 1) {
                        parent.children.push({
                            title: pathParts[i],
                            key: index,
                            icon: <BsFileEarmarkCode />
                        });
                    }
                }
            }
        });
        setTreeData(tree);
    };

    const getFileContent = async (path) => {
        try {
            setIsFileContentLoading(true);
            const response = await httpRequest(
                'GET',
                ApiEndpoints.GET_FUNCTION_FILE_CODE +
                    '?repo=' +
                    encodeURI(metaData?.repo) +
                    '&branch=' +
                    encodeURI(metaData?.branch) +
                    '&owner=' +
                    encodeURI(metaData?.owner) +
                    '&scm=' +
                    encodeURI(metaData?.scm) +
                    '&function_name=' +
                    encodeURI(metaData?.function_name) +
                    '&path=' +
                    encodeURI(path) +
                    '&version=' +
                    encodeURI(selectedVersion === 'latest' ? '' : selectedVersion)
            );
            setFileContent(response?.content);
        } catch (e) {
        } finally {
            setIsFileContentLoading(false);
        }
    };

    const onSelect = async (selectedKeys, info) => {
        const path = !isNaN(selectedKeys[0]) ? files[selectedKeys[0]] : null;
        if (!path) return;
        const lang = path?.split('.');
        lang?.length > 1 && setSelectedLanguage(lang[lang.length - 1]);
        setPath(path);
        getFileContent(path);
    };

    const modifiedContent = (content) => {
        return content
            ?.replace(/```json([\s\S]*?)```/g, (match, p1) => {
                return `<div className="code-block">${p1.trim()}</div>`;
            })
            ?.replace(/`([\s\S]*?)`/g, (match, p1) => {
                return `<div className="code-var">${p1.trim()}</div>`;
            })
            ?.replace(/`/g, '\\`');
    };

    const shortInstallBtn = metaData?.installed_in_progress || (metaData?.installed && !metaData?.updates_available);
    const installBtnPlaceholder = metaData?.installed_in_progress ? (
        ''
    ) : selectedFunction?.installed ? (
        <div className="code-btn">
            {metaData?.updates_available ? <BiDownload className="Install" /> : <DeleteIcon className="Uninstall" />}
            {metaData?.updates_available ? <label>Update</label> : null}
        </div>
    ) : (
        <div className="code-btn">
            <BiDownload className="Install" />
            <label>Install</label>
        </div>
    );

    const handleInstallBtnClick = () => {
        if (metaData?.installed) {
            if (metaData?.updates_available) {
                handleInstall();
            } else handleUnInstall();
        } else {
            handleInstall();
        }
        onBackToFunction && onBackToFunction();
    };

    return (
        <div className="function-drawer-container" onClick={(e) => e.stopPropagation()}>
            {onBackToFunction && (
                <div className="back-to-function" onClick={onBackToFunction}>
                    <ArrowBackIcon />
                    <span>Back to function</span>
                </div>
            )}

            <div className="drawer-header ">
                {metaData?.image ? (
                    <img src={metaData?.image} alt="Function icon" height="120px" width="120px" />
                ) : (
                    <FunctionIcon alt="Function icon" height="120px" width="120px" />
                )}

                <div className="right-side">
                    <div className="title">{metaData?.function_name || metaData?.name}</div>
                    <div>
                        <deatils is="x3d">
                            <div className="function-owner">
                                {metaData?.owner === OWNER && <MemphisFunctionIcon alt="Memphis function icon" height="15px" />}
                                <owner is="x3d">{metaData?.owner === OWNER ? 'Memphis.dev' : metaData?.owner}</owner>
                            </div>
                            <Divider type="vertical" />
                            {metaData?.owner === OWNER && (
                                <>
                                    <downloads is="x3d">
                                        <BiDownload className="download-icon" />
                                        <label>{Number(selectedFunction?.forks).toLocaleString()}</label>
                                    </downloads>
                                    <Divider type="vertical" />
                                    <rate is="x3d">
                                        <Rate disabled defaultValue={selectedFunction?.stars} className="stars-rate" />
                                        <label>{`(${selectedFunction?.rates})`}</label>
                                    </rate>
                                    <Divider type="vertical" />
                                </>
                            )}
                            <commits is="x3d">
                                <FiGitCommit />
                                <OverflowTip text={parsingDate(metaData?.installed_updated_at, true, true)} width={'220px'}>
                                    Last modified on {parsingDate(metaData?.installed_updated_at, true, true)}
                                </OverflowTip>
                            </commits>
                        </deatils>
                    </div>
                    <description is="x3d">
                        <OverflowTip text={metaData?.description} width={'520px'}>
                            {metaData?.description}
                        </OverflowTip>
                    </description>
                    <actions is="x3d">
                        {!stationView && (
                            <>
                                <div className="action-section-btn">
                                    <div className="header-flex">
                                        <Button
                                            placeholder={
                                                isCloud() && !state?.allowedActions?.can_apply_functions ? (
                                                    <span className="attach-btn">
                                                        <label>Attach</label>
                                                        <FaArrowCircleUp className="lock-feature-icon" />
                                                    </span>
                                                ) : (
                                                    <span className="attach-btn">Attach</span>
                                                )
                                            }
                                            width={'100px'}
                                            backgroundColorType={'purple'}
                                            colorType={'white'}
                                            radiusType={'circle'}
                                            fontSize="12px"
                                            fontFamily="InterSemiBold"
                                            onClick={() => (!isCloud() || state?.allowedActions?.can_apply_functions ? clickApply('attach') : setOpenUpgradeModal(true))}
                                            disabled={metaData?.installed_in_progress || !metaData?.installed}
                                        />
                                    </div>
                                    <div className="header-flex">
                                        <Tooltip text={metaData?.invalid_reason}>
                                            <span>
                                                <Button
                                                    placeholder={installBtnPlaceholder}
                                                    colorType={shortInstallBtn ? 'purple' : 'white'}
                                                    width={shortInstallBtn ? '34px' : '100px'}
                                                    backgroundColorType={shortInstallBtn ? 'white' : 'purple'}
                                                    border={shortInstallBtn ? 'gray-light' : null}
                                                    radiusType={'circle'}
                                                    fontSize="12px"
                                                    fontFamily="InterSemiBold"
                                                    onClick={handleInstallBtnClick}
                                                    isLoading={metaData?.installed_in_progress}
                                                    disabled={!metaData?.is_valid || metaData?.installed_in_progress}
                                                />
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                            </>
                        )}
                        <span className="git">
                            <div className="header-flex">
                                <Button
                                    placeholder={<BsGit className="attach-btn" alt="Git" />}
                                    width={'32px'}
                                    backgroundColorType={'orange-dark'}
                                    colorType={'white'}
                                    radiusType={'circle'}
                                    fontSize="16px"
                                    fontFamily="InterSemiBold"
                                    onClick={() =>
                                        window.open(
                                            `https://github.com/${metaData?.owner}/${metaData?.repo}/tree/${metaData?.branch}/${
                                                metaData?.function_name || metaData?.name
                                            }`
                                        )
                                    }
                                />
                            </div>
                            <SelectComponent
                                colorType="black"
                                backgroundColorType="none"
                                radiusType="circle"
                                borderColorType="gray"
                                height="32px"
                                width={'150px'}
                                popupClassName="select-options"
                                fontSize="12px"
                                fontFamily="InterSemiBold"
                                value={`Version: ${selectedVersion}`}
                                disabled={!metaData?.installed}
                                onChange={(e) => {
                                    setSelectedVersion(e);
                                }}
                                options={versions}
                            />
                        </span>
                    </actions>
                </div>
            </div>
            <div>
                <CustomTabs tabs={['Details', 'Code']} value={tabValue} onChange={(tabValue) => setTabValue(tabValue)} />
            </div>
            <TestMockEvent
                functionDetails={metaData}
                clickOutside={() => setIsTestFunctionModalOpen(false)}
                open={isTestFunctionModalOpen}
                selectedVersion={selectedVersion}
            />
            {tabValue === 'Details' && (
                <code is="x3d">
                    <span className="readme">
                        {loading && (
                            <div className="loader">
                                {' '}
                                <Spinner />
                            </div>
                        )}
                        {!loading && readme === '' && renderNoFunctionDetails}
                        {!loading && readme && readme !== '' && (
                            <div>
                                <ReactMarkdown rehypePlugins={[rehypeRaw, remarkGfm, rehypeSlug]} className="custom-markdown">
                                    {modifiedContent(formattedMarkdownContent(emojiSupport(readme)))}
                                </ReactMarkdown>
                            </div>
                        )}
                    </span>
                    <Divider type="vertical" />
                    <span className="function-details">
                        <div>
                            <deatils is="x3d">
                                <label className="label-title">Information</label>
                                <info is="x3d">
                                    <repo is="x3d">
                                        <GoRepo />
                                        <label>{metaData?.repo}</label>
                                    </repo>
                                    <branch is="x3d">
                                        <GithubBranchIcon />
                                        <label>{metaData?.branch}</label>
                                    </branch>
                                    {metaData?.is_valid && (
                                        <language is="x3d">
                                            <CodeBlackIcon />
                                            <label>{metaData?.language}</label>
                                        </language>
                                    )}
                                </info>
                            </deatils>
                            <Divider />
                            <label className="label-title">Social</label>
                            <deatils is="x3d">
                                {metaData?.owner === OWNER && (
                                    <>
                                        <downloads is="x3d">
                                            <BiDownload className="download-icon" />
                                            <label>{Number(selectedFunction?.forks).toLocaleString()}</label>
                                        </downloads>
                                        <Divider type="vertical" />
                                        <rate is="x3d">
                                            <Rate disabled defaultValue={selectedFunction?.stars} className="stars-rate" />
                                            <label>{`(${selectedFunction?.rates})`}</label>
                                        </rate>
                                        <Divider type="vertical" />
                                    </>
                                )}
                                <commits is="x3d">
                                    <FiGitCommit />
                                    <OverflowTip text={parsingDate(metaData?.installed_updated_at, true, true)} width={'210px'}>
                                        Last modified on {parsingDate(metaData?.installed_updated_at, true, true)}
                                    </OverflowTip>
                                </commits>
                            </deatils>
                            <Divider />
                            {metaData?.is_valid && (
                                <>
                                    <label className="label-title">Tags</label>
                                    <TagsList tagsToShow={3} tags={metaData?.tags} entityType="function" entityName={metaData?.function_name || metaData?.name} />
                                    <Divider />
                                </>
                            )}
                        </div>
                        {metaData?.inputs && metaData?.inputs?.length > 0 && (
                            <>
                                <label className="label-title">Expected inputs</label>
                                <inputsSection is="x3d">
                                    {metaData?.inputs?.map((input, index) => (
                                        <div className="input-row" key={`${input?.name}${index}`}>
                                            <RxDotFilled /> <label>{input?.name}</label>
                                        </div>
                                    ))}
                                </inputsSection>
                            </>
                        )}
                    </span>
                </code>
            )}
            {tabValue === 'Code' && (
                <div className={`source-code ${onBackToFunction ? 'source-code-stations' : 'source-code-functions'}`}>
                    <div>
                        <label className="source-code-title">Code tree</label>
                        <div className="repos-section">
                            <Tree
                                showLine={false}
                                showIcon={true}
                                defaultExpandedKeys={['0-0-0']}
                                treeData={treeData}
                                onSelect={onSelect}
                                switcherIcon={({ expanded }) => (
                                    <CollapseArrowIcon className={expanded ? 'collapse-arrow open arrow' : 'collapse-arrow arrow'} alt="collapse-arrow" />
                                )}
                                defaultExpandAll={true}
                            />
                        </div>
                    </div>
                    <div className="code-content-section">
                        <>
                            {!metaData?.installed ? (
                                <Tooltip text="Install the function to enable test">
                                    <span>
                                        <Button
                                            placeholder="Test"
                                            width={'100px'}
                                            backgroundColorType={'orange'}
                                            colorType={'black'}
                                            radiusType={'circle'}
                                            fontSize="12px"
                                            fontFamily="InterSemiBold"
                                            onClick={() => setIsTestFunctionModalOpen(true)}
                                            disabled={!metaData?.installed}
                                        />
                                    </span>
                                </Tooltip>
                            ) : (
                                <Button
                                    placeholder="Test"
                                    width={'100px'}
                                    backgroundColorType={'orange'}
                                    colorType={'black'}
                                    radiusType={'circle'}
                                    fontSize="12px"
                                    fontFamily="InterSemiBold"
                                    onClick={() => setIsTestFunctionModalOpen(true)}
                                    disabled={!metaData?.installed || metaData?.installed_in_progress}
                                />
                            )}
                            <div className="code-content">
                                {isFileContentLoading ? (
                                    <Spinner />
                                ) : fileContent ? (
                                    <Editor
                                        options={{
                                            minimap: { enabled: false },
                                            scrollbar: { verticalScrollbarSize: 0, horizontalScrollbarSize: 0 },
                                            scrollBeyondLastLine: false,
                                            roundedSelection: false,
                                            formatOnPaste: true,
                                            formatOnType: true,
                                            readOnly: true,
                                            fontSize: '12px',
                                            fontFamily: 'Inter'
                                        }}
                                        language={getCodingLanguage(selectedLanguage)?.toLocaleLowerCase()}
                                        height="calc(100% - 10px)"
                                        width="calc(100% - 25px)"
                                        value={fileContent}
                                    />
                                ) : (
                                    <p>Please choose a file from the tree on the left.</p>
                                )}
                            </div>
                        </>
                    </div>
                </div>
            )}
            <CloudModal type="upgrade" open={openUpgradeModal} handleClose={() => setOpenUpgradeModal(false)} />
        </div>
    );
}

export default FunctionDetails;
