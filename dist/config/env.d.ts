export declare const config: {
    sql: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        encrypt: boolean;
        trustServerCertificate: boolean;
    };
    server: {
        port: number;
    };
    auth: {
        token: string | undefined;
        apiKey: string | undefined;
    };
    limits: {
        maxQueryRows: number;
        defaultPreviewRows: number;
        defaultSampleValues: number;
    };
};
export declare function loadEnv(): typeof config;
//# sourceMappingURL=env.d.ts.map