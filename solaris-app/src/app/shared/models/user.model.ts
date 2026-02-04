export interface UserDataModel {
    _id: string;
    username: string;
    password: string;
    Group: string;
    pageAccess: string[];
    siteAccess: string[];
    firstName?: string;
    lastName?: string;
};

export interface AddUserRequestModel {
    username: string;
    password: string;
    Group: string;
    pageAccess: string[];
    siteAccess: string[];
    firstName?: string;
    lastName?: string;
};

export interface UpdateUserRequestModel {
    _id: string;
    username?: string;
    password?: string;
    Group?: string;
    pageAccess?: string[];
    siteAccess?: string[];
    firstName?: string;
    lastName?: string;
}

export interface DeleteUserRequestModel {
    _id: string;
}

export interface ChnagePasswordRequestModel {
    _id: string;
    oldpassword: string;
    newpassword: string;
}

export interface UserRespondModel {
    success: boolean;
    message: string;
}