import { Request, Response, NextFunction } from "express";
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function unless(middleware: any, ...paths: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare const auth: (req: Request, res: Response, next: NextFunction) => void;
export declare const validate: (schema: any) => (req: any, res: any, next: any) => Promise<void>;
