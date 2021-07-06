export declare const createToken: ({ id, email }: {
    id: string;
    email: string;
}) => string;
export declare const verifyToken: (token: string) => {
    id: string;
    email: string;
};
