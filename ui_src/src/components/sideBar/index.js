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

import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { SettingOutlined, ExceptionOutlined } from '@ant-design/icons';
import ExitToAppOutlined from '@material-ui/icons/ExitToAppOutlined';
import PersonOutlinedIcon from '@material-ui/icons/PersonOutlined';
import { BsFillChatSquareTextFill } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import { Divider, Popover } from 'antd';
import CloudMoadl from 'components/cloudModal';
import {
    LOCAL_STORAGE_ACCOUNT_NAME,
    LOCAL_STORAGE_AVATAR_ID,
    LOCAL_STORAGE_COMPANY_LOGO,
    LOCAL_STORAGE_FULL_NAME,
    LOCAL_STORAGE_USER_NAME,
    LOCAL_STORAGE_SKIP_GET_STARTED,
    USER_IMAGE
} from 'const/localStorageConsts';
import { ReactComponent as IntegrationColorIcon } from 'assets/images/integrationIconColor.svg';
import { ReactComponent as OverviewActiveIcon } from 'assets/images/overviewIconActive.svg';
import { ReactComponent as StationsActiveIcon } from 'assets/images/stationsIconActive.svg';
import { compareVersions, isCloud, showUpgradePlan } from 'services/valueConvertor';
import { ReactComponent as FunctionsActiveIcon } from 'assets/images/functionsIconActive.svg';
import { ReactComponent as SchemaActiveIcon } from 'assets/images/schemaIconActive.svg';
import { ReactComponent as IntegrationIcon } from 'assets/images/integrationIcon.svg';
import { HiUsers } from 'react-icons/hi';
import { ReactComponent as FunctionsIcon } from 'assets/images/functionsIcon.svg';
import { ReactComponent as OverviewIcon } from 'assets/images/overviewIcon.svg';
import { ReactComponent as StationsIcon } from 'assets/images/stationsIcon.svg';
import { ReactComponent as SupportIcon } from 'assets/images/supportIcon.svg';
import { ReactComponent as SupportColorIcon } from 'assets/images/supportColorIcon.svg';
import { ReactComponent as NewStationIcon } from 'assets/images/newStationIcon.svg';
import { ReactComponent as NewSchemaIcon } from 'assets/images/newSchemaIcon.svg';
import { ReactComponent as NewUserIcon } from 'assets/images/newUserIcon.svg';
import { ReactComponent as NewIntegrationIcon } from 'assets/images/newIntegrationIcon.svg';
import { BsHouseHeartFill } from 'react-icons/bs';
import { ReactComponent as EditIcon } from 'assets/images/editIcon.svg';
import { ReactComponent as QuickActionBtn } from 'assets/images/quickActionBtn.svg';
import { ReactComponent as AddUserIcon } from 'assets/images/addUserIcon.svg';
import { GithubRequest } from 'services/githubRequests';
import { ReactComponent as LogsActiveIcon } from 'assets/images/logsActive.svg';
import { ReactComponent as SchemaIcon } from 'assets/images/schemaIcon.svg';
import { LATEST_RELEASE_URL } from 'config';
import { ReactComponent as LogsIcon } from 'assets/images/logsIcon.svg';
import { FaArrowCircleUp } from 'react-icons/fa';
import { ApiEndpoints } from 'const/apiEndpoints';
import { httpRequest } from 'services/http';
import Logo from 'assets/images/logo.svg';
import AuthService from 'services/auth';
import { sendTrace, useGetAllowedActions } from 'services/genericServices';
import { Context } from 'hooks/store';
import pathDomains from 'router';
import Spinner from '../spinner';
import Support from './support';
import LearnMore from 'components/learnMore';
import GetStarted from 'components/getStartedModal';
import Modal from 'components/modal';
import CreateStationForm from 'components/createStationForm';
import { ReactComponent as StationIcon } from 'assets/images/stationIcon.svg';
import CreateUserDetails from 'domain/users/createUserDetails';
import UpgradePlans from 'components/upgradePlans';
import { FaBook, FaDiscord } from 'react-icons/fa';
import { BiEnvelope } from 'react-icons/bi';

const overlayStyles = {
    borderRadius: '8px',
    width: '230px',
    paddingTop: '5px',
    paddingBottom: '5px',
    marginBottom: '10px'
};

const quickActionsStyles = {
    borderRadius: '8px',
    width: '250px',
    paddingTop: '5px',
    paddingBottom: '5px',
    marginBottom: '10px'
};

const supportContextMenuStyles = {
    borderRadius: '8px',
    paddingTop: '5px',
    paddingBottom: '5px',
    marginBottom: '10px'
};
const overlayStylesSupport = {
    marginTop: window.innerHeight > 560 && 'calc(100vh - 560px)',
    borderRadius: '8px',
    width: '380px',
    padding: '15px',
    marginBottom: '10px'
};

function SideBar() {
    const [state, dispatch] = useContext(Context);
    const history = useHistory();
    const createStationRef = useRef(null);
    const createUserRef = useRef(null);

    const [avatarUrl, SetAvatarUrl] = useState(require('assets/images/bots/avatar1.svg'));
    const [popoverOpenSetting, setPopoverOpenSetting] = useState(false);
    const [popoverOpenSupport, setPopoverOpenSupport] = useState(false);
    const [popoverOpenSupportContextMenu, setPopoverOpenSupportContextMenu] = useState(false);
    const [popoverQuickActoins, setPopoverQuickActions] = useState(false);
    const [hoveredItem, setHoveredItem] = useState('');
    const [logoutLoader, setLogoutLoader] = useState(false);
    const [cloudModalOpen, setCloudModalOpen] = useState(false);
    const [openGetStartedModal, setOpenGetStartedModal] = useState(false);
    const [createStationModal, createStationModalFlip] = useState(false);
    const [creatingProsessd, setCreatingProsessd] = useState(false);
    const [addUserModalIsOpen, addUserModalFlip] = useState(false);
    const [createUserLoader, setCreateUserLoader] = useState(false);
    const [bannerType, setBannerType] = useState('');
    const getAllowedActions = useGetAllowedActions();

    const getCompanyLogo = useCallback(async () => {
        try {
            const data = await httpRequest('GET', ApiEndpoints.GET_COMPANY_LOGO);
            if (data) {
                localStorage.setItem(LOCAL_STORAGE_COMPANY_LOGO, data.image);
                dispatch({ type: 'SET_COMPANY_LOGO', payload: data.image });
            }
        } catch (error) {}
    }, []);

    const getSystemVersion = useCallback(async () => {
        try {
            const data = await httpRequest('GET', ApiEndpoints.GET_CLUSTER_INFO);
            if (data) {
                const latest = await GithubRequest(LATEST_RELEASE_URL);
                let is_latest = compareVersions(data.version, latest[0].name.replace('v', '').replace('-beta', '').replace('-latest', '').replace('-stable', ''));
                let system_version = data.version;
                dispatch({ type: 'IS_LATEST', payload: is_latest });
                dispatch({ type: 'CURRENT_VERSION', payload: system_version });
            }
        } catch (error) {}
    }, []);

    useEffect(() => {
        getCompanyLogo().catch(console.error);
        {
            !isCloud() && getSystemVersion().catch(console.error);
        }
        isCloud() && getAllowedActions();
        setAvatarImage(localStorage.getItem(LOCAL_STORAGE_AVATAR_ID) || state?.userData?.avatar_id);
        localStorage.getItem(LOCAL_STORAGE_SKIP_GET_STARTED) !== 'true' && setOpenGetStartedModal(true);
    }, []);

    useEffect(() => {
        setAvatarImage(localStorage.getItem(LOCAL_STORAGE_AVATAR_ID) || state?.userData?.avatar_id);
    }, [state]);

    const setAvatarImage = (avatarId) => {
        SetAvatarUrl(require(`assets/images/bots/avatar${avatarId}.svg`));
    };

    const handleLogout = async () => {
        setLogoutLoader(true);
        if (isCloud()) {
            try {
                const data = await httpRequest('POST', ApiEndpoints.SIGN_OUT);
                if (data) {
                    setTimeout(() => {
                        AuthService.logout();
                        setLogoutLoader(false);
                    }, 1000);
                }
            } catch (error) {
                setLogoutLoader(false);
            }
        } else {
            AuthService.logout();
            setTimeout(() => {
                setLogoutLoader(false);
            }, 1000);
        }
    };

    const handleAddUser = () => {
        setCreateUserLoader(false);
        addUserModalFlip(false);
    };

    const MenuItem = ({ icon, activeIcon, name, route, onClick, onMouseEnter, onMouseLeave, badge }) => {
        return (
            <div className="item-wrapper" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
                <div className="icon">{state.route === route ? activeIcon : hoveredItem === route ? activeIcon : icon}</div>
                <p className={state.route === route ? 'checked' : 'name'}>{name}</p>
                {badge && <label className="badge">{badge}</label>}
            </div>
        );
    };

    const PopoverActionItem = ({ icon, name, onClick, upgrade }) => {
        upgrade && setBannerType('upgrade');
        return (
            <div
                className="item-wrap"
                onClick={() => {
                    if (upgrade) {
                        setCloudModalOpen(true);
                        setPopoverQuickActions(false);
                    } else onClick();
                }}
            >
                <div className="item">
                    <span className="icons">{icon}</span>
                    <p className="item-title">{name}</p>
                </div>
                {isCloud() && upgrade && (
                    <div>
                        <FaArrowCircleUp className="lock-feature-icon" />
                    </div>
                )}
            </div>
        );
    };

    const contentQuickStart = (
        <div className="menu-content">
            <PopoverActionItem
                icon={<NewStationIcon className="icons-sidebar" />}
                name="Create a new station"
                onClick={() => {
                    sendTrace('quick-actions-station', {});
                    setPopoverQuickActions(false);
                    createStationModalFlip(true);
                }}
                upgrade={!state?.allowedActions?.can_create_stations}
            />
            <PopoverActionItem
                icon={<NewSchemaIcon className="icons-sidebar" />}
                name="Create a new schema"
                onClick={() => {
                    sendTrace('quick-actions-schema', {});
                    setPopoverQuickActions(false);
                    history.replace({
                        pathname: `${pathDomains.schemaverse}/create`,
                        create: true
                    });
                }}
            />
            <PopoverActionItem
                icon={<NewUserIcon className="icons-sidebar" />}
                name="Create a new user"
                onClick={() => {
                    sendTrace('quick-actions-user', {});
                    setPopoverQuickActions(false);
                    addUserModalFlip(true);
                }}
                upgrade={!state?.allowedActions?.can_create_users}
            />
            <PopoverActionItem
                icon={<NewIntegrationIcon className="icons-sidebar" />}
                name="Connect a new integration"
                onClick={() => {
                    sendTrace('quick-actions-integration', {});
                    setPopoverQuickActions(false);
                    history.replace(`${pathDomains.administration}/integrations`);
                }}
            />
        </div>
    );

    const contentSetting = (
        <div className="menu-content">
            <div className="item-wrap-header">
                <span className="img-section">
                    <img
                        className={'avatar-image'}
                        src={localStorage.getItem(USER_IMAGE) && localStorage.getItem(USER_IMAGE) !== 'undefined' ? localStorage.getItem(USER_IMAGE) : avatarUrl}
                        referrerPolicy="no-referrer"
                        width="30"
                        alt="avatar"
                    ></img>
                    <span className="company-logo">
                        <img src={state?.companyLogo || Logo} width="15" height="15" alt="companyLogo" />
                    </span>
                </span>
                <div className="account-details">
                    <p className="username">
                        {localStorage.getItem(LOCAL_STORAGE_FULL_NAME) !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_FULL_NAME) !== ''
                            ? localStorage.getItem(LOCAL_STORAGE_FULL_NAME)
                            : localStorage.getItem(LOCAL_STORAGE_USER_NAME)}
                    </p>
                    {isCloud() && <span className="company-name">{state?.userData?.account_name || localStorage.getItem(LOCAL_STORAGE_ACCOUNT_NAME)}</span>}
                </div>
            </div>
            <Divider />
            <PopoverActionItem
                icon={<PersonOutlinedIcon className="icons-sidebar" />}
                name="Profile"
                onClick={() => {
                    history.replace(`${pathDomains.administration}/profile`);
                    setPopoverOpenSetting(false);
                }}
            />
            <PopoverActionItem
                icon={<SettingOutlined className="icons-sidebar" />}
                name="Administration"
                onClick={() => {
                    history.replace(`${pathDomains.administration}/integrations`);
                    setPopoverOpenSetting(false);
                }}
            />
            {isCloud() && (
                <PopoverActionItem
                    icon={<ExceptionOutlined className="icons-sidebar" />}
                    name="Billing"
                    onClick={() => {
                        history.replace(`${pathDomains.administration}/usage`);
                        setPopoverOpenSetting(false);
                    }}
                />
            )}
            <PopoverActionItem icon={logoutLoader ? <Spinner /> : <ExitToAppOutlined className="icons-sidebar" />} name="Log out" onClick={() => handleLogout()} />
        </div>
    );

    const supportContextMenu = (
        <div className="menu-content">
            <PopoverActionItem
                icon={<BsHouseHeartFill className="icons-sidebar" />}
                name="Getting started"
                onClick={() => {
                    setOpenGetStartedModal(true);
                    setPopoverOpenSupportContextMenu(!popoverOpenSupportContextMenu);
                }}
            />
            <PopoverActionItem
                icon={<FaBook className="icons-sidebar" />}
                name="Documentation"
                onClick={() => {
                    setPopoverOpenSupportContextMenu(false);
                    window.open('https://memphis.dev/docs', '_blank');
                }}
            />
            <PopoverActionItem
                icon={<FaDiscord className="icons-sidebar" />}
                name="Discord channel"
                onClick={() => {
                    setPopoverOpenSupportContextMenu(false);
                    window.open('https://memphis.dev/discord', '_blank');
                }}
            />
            {!isCloud() && (
                <>
                    <PopoverActionItem
                        icon={<BsFillChatSquareTextFill className="icons-sidebar" />}
                        name="Open service request"
                        onClick={() => {
                            setBannerType('bundle');
                            setCloudModalOpen(true);
                            setPopoverOpenSupportContextMenu(!popoverOpenSupportContextMenu);
                        }}
                    />
                </>
            )}

            {isCloud() && (
                <div className="item-wrap">
                    <Popover
                        overlayInnerStyle={overlayStylesSupport}
                        placement="bottomRight"
                        content={<Support closeModal={(e) => setPopoverOpenSupport(e)} />}
                        trigger="click"
                        onOpenChange={() => setPopoverOpenSupport(!popoverOpenSupport)}
                        open={popoverOpenSupport}
                        onClick={() => {
                            setPopoverOpenSupportContextMenu(false);
                        }}
                    >
                        <div className="item">
                            <span className="icons">
                                <BiEnvelope className="icons-sidebar" />
                            </span>
                            <p className="item-title">Open a service request</p>
                        </div>
                    </Popover>
                </div>
            )}
        </div>
    );

    return (
        <div className="sidebar-container">
            <div className="upper-icons">
                <span className="logo-wrapper">
                    <img
                        src={isCloud() ? state?.companyLogo || Logo : Logo}
                        width="45"
                        height="45"
                        className="logoimg"
                        alt="logo"
                        onClick={() => history.replace(pathDomains.overview)}
                    />
                    <EditIcon alt="edit" className="edit-logo" onClick={() => history.replace(`${pathDomains.administration}/profile`)} />
                </span>

                <Popover
                    overlayInnerStyle={quickActionsStyles}
                    placement="rightBottom"
                    content={contentQuickStart}
                    trigger="click"
                    onOpenChange={() => setPopoverQuickActions(!popoverQuickActoins)}
                    open={popoverQuickActoins}
                >
                    <div className="item-wrapper" onMouseEnter={() => setHoveredItem('actions')} onMouseLeave={() => setHoveredItem('')}>
                        <div className="icon">
                            <QuickActionBtn alt="Quick actions" onClick={() => sendTrace('quick-actions-click', {})} />
                        </div>
                    </div>
                </Popover>
                <MenuItem
                    icon={<OverviewIcon alt="OverviewIcon" width={20} height={20} />}
                    activeIcon={<OverviewActiveIcon alt="OverviewActiveIcon" width={20} height={20} />}
                    name="Overview"
                    onClick={() => history.replace(pathDomains.overview)}
                    onMouseEnter={() => setHoveredItem('overview')}
                    onMouseLeave={() => setHoveredItem('')}
                    route="overview"
                />
                <MenuItem
                    icon={<StationsIcon alt="StationsIcon" width={20} height={20} />}
                    activeIcon={<StationsActiveIcon alt="StationsActiveIcon" width={20} height={20} />}
                    name="Stations"
                    onClick={() => history.replace(pathDomains.stations)}
                    onMouseEnter={() => setHoveredItem('stations')}
                    onMouseLeave={() => setHoveredItem('')}
                    route="stations"
                />
                <MenuItem
                    icon={<SchemaIcon alt="SchemaIcon" width={20} height={20} />}
                    activeIcon={<SchemaActiveIcon alt="SchemaActiveIcon" width={20} height={20} />}
                    name="Schemaverse"
                    onClick={() => history.replace(`${pathDomains.schemaverse}/list`)}
                    onMouseEnter={() => setHoveredItem('schemaverse')}
                    onMouseLeave={() => setHoveredItem('')}
                    route="schemaverse"
                />
                <MenuItem
                    icon={<FunctionsIcon alt="functionsIcon" width="20" height="20" />}
                    activeIcon={<FunctionsActiveIcon alt="FunctionsActiveIcon" width={20} height={20} />}
                    name="Functions"
                    onClick={() => history.replace(pathDomains.functions)}
                    onMouseEnter={() => setHoveredItem('functions')}
                    onMouseLeave={() => setHoveredItem('')}
                    route="functions"
                    badge={'Alpha'}
                />
                <MenuItem
                    icon={<IntegrationIcon alt="IntegrationIcon" width={20} height={20} />}
                    activeIcon={<IntegrationColorIcon alt="IntegrationColorIcon" width={20} height={20} />}
                    name="Integrations"
                    onClick={() => history.replace(`${pathDomains.administration}/integrations`)}
                    onMouseEnter={() => setHoveredItem('administration')}
                    onMouseLeave={() => setHoveredItem('')}
                    route="administration"
                />
            </div>
            <CloudMoadl type={bannerType} open={cloudModalOpen} handleClose={() => setCloudModalOpen(false)} />
            <div className="bottom-icons">
                {!isCloud() && (
                    <MenuItem
                        icon={<LogsIcon alt="LogsIcon" width={20} height={20} />}
                        activeIcon={<LogsActiveIcon alt="LogsActiveIcon" width={20} height={20} />}
                        name="Logs"
                        onClick={() => history.replace(pathDomains.sysLogs)}
                        onMouseEnter={() => setHoveredItem('logs')}
                        onMouseLeave={() => setHoveredItem('')}
                        route="logs"
                    />
                )}
                <MenuItem
                    icon={<HiUsers alt="LogsIcon" className="sidebar-title" size={'20px'} />}
                    activeIcon={<HiUsers alt="LogsActiveIcon" className="sidebar-title ms-active" size={'20px'} />}
                    name="Users"
                    onClick={() => history.replace(pathDomains.users)}
                    onMouseEnter={() => setHoveredItem('users')}
                    onMouseLeave={() => setHoveredItem('')}
                    route="users"
                />
                <Popover
                    overlayInnerStyle={supportContextMenuStyles}
                    placement="right"
                    content={supportContextMenu}
                    trigger="click"
                    onOpenChange={() => setPopoverOpenSupportContextMenu(!popoverOpenSupportContextMenu)}
                    open={popoverOpenSupportContextMenu}
                >
                    <MenuItem
                        icon={<SupportIcon alt="SupportIcon" width={20} height={20} />}
                        activeIcon={<SupportColorIcon alt="SupportIcon" width={20} height={20} />}
                        name="Support"
                        onMouseEnter={() => setHoveredItem('support')}
                        onMouseLeave={() => setHoveredItem('')}
                        route="support"
                    />
                </Popover>

                <Popover
                    overlayInnerStyle={overlayStyles}
                    placement="right"
                    content={contentSetting}
                    trigger="click"
                    onOpenChange={() => setPopoverOpenSetting(!popoverOpenSetting)}
                    open={popoverOpenSetting}
                >
                    <div className="sub-icon-wrapper" onClick={() => setPopoverOpenSetting(true)}>
                        <img
                            className={`sandboxUserImg ${(state.route === 'profile' || state.route === 'administration') && 'sandboxUserImgSelected'}`}
                            src={localStorage.getItem(USER_IMAGE) && localStorage.getItem(USER_IMAGE) !== 'undefined' ? localStorage.getItem(USER_IMAGE) : avatarUrl}
                            referrerPolicy="no-referrer"
                            width={localStorage.getItem(USER_IMAGE) && localStorage.getItem(USER_IMAGE) !== 'undefined' ? 35 : 25}
                            height={localStorage.getItem(USER_IMAGE) && localStorage.getItem(USER_IMAGE) !== 'undefined' ? 35 : 25}
                            alt="avatar"
                        />
                    </div>
                </Popover>
                {!isCloud() && (
                    <version
                        is="x3d"
                        style={{ cursor: !state.isLatest ? 'pointer' : 'default' }}
                        onClick={() => (!state.isLatest ? history.replace(`${pathDomains.administration}/version_upgrade`) : null)}
                    >
                        {!state.isLatest && <div className="update-note" />}
                        <p>v{state.currentVersion}</p>
                    </version>
                )}
                {showUpgradePlan() && (
                    <UpgradePlans
                        content={
                            <div className="upgrade-button-wrapper">
                                <p className="upgrade-plan">Upgrade</p>
                            </div>
                        }
                        isExternal={false}
                    />
                )}
            </div>
            <GetStarted open={openGetStartedModal} handleClose={() => setOpenGetStartedModal(false)} />
            <Modal
                header={
                    <div className="modal-header">
                        <div className="header-img-container">
                            <StationIcon className="headerImage" alt="stationImg" />
                        </div>
                        <p>Create a new station</p>
                        <label>
                            A station is a distributed unit that stores the produced data{' '}
                            <LearnMore url="https://docs.memphis.dev/memphis/memphis-broker/concepts/station" />
                        </label>
                    </div>
                }
                height="58vh"
                width="1020px"
                rBtnText="Create"
                lBtnText="Cancel"
                lBtnClick={() => {
                    createStationModalFlip(false);
                }}
                rBtnClick={() => {
                    createStationRef.current();
                }}
                clickOutside={() => createStationModalFlip(false)}
                open={createStationModal}
                isLoading={creatingProsessd}
            >
                <CreateStationForm
                    createStationFormRef={createStationRef}
                    setLoading={(e) => setCreatingProsessd(e)}
                    finishUpdate={(e) => createStationModalFlip(false)}
                />
            </Modal>
            <Modal
                header={
                    <div className="modal-header">
                        <div className="header-img-container">
                            <AddUserIcon className="headerImage" alt="stationImg" />
                        </div>
                        <p>Add a new user</p>
                        <label>Enter user details to get started</label>
                    </div>
                }
                width="450px"
                rBtnText="Create"
                lBtnText="Cancel"
                lBtnClick={() => {
                    addUserModalFlip(false);
                    setCreateUserLoader(false);
                }}
                clickOutside={() => {
                    setCreateUserLoader(false);
                    addUserModalFlip(false);
                }}
                rBtnClick={() => {
                    setCreateUserLoader(true);
                    createUserRef.current();
                }}
                isLoading={createUserLoader}
                open={addUserModalIsOpen}
            >
                <CreateUserDetails createUserRef={createUserRef} closeModal={(userData) => handleAddUser(userData)} handleLoader={(e) => setCreateUserLoader(e)} />
            </Modal>
        </div>
    );
}

export default SideBar;
