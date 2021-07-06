/// <reference types="express-serve-static-core" />
/// <reference types="node" />
import express from "express";
import { Controller, ControllerDeps } from "./controllers/types";
export declare const createServer: (dependencies: ControllerDeps, ...controllers: Controller[]) => express.Express;
export declare const startServer: ({ app, port, }: {
    app: express.Express;
    port: number | string;
}) => Promise<import("http").Server>;
