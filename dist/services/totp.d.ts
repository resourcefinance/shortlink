declare function generate(): Promise<string>;
declare function validate(token: string): Promise<boolean>;
export { validate, generate };
