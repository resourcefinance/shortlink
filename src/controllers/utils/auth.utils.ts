import jwt from "jsonwebtoken";
import config from "../../config";

if (!config.JWT_SECRET) {
  console.error("NO TOKEN SECRET FOUND");
  process.exit(1);
}

export const createToken = ({ id, email }: { id: string; email: string }) => {
  const token = jwt.sign(
    {
      id,
      email,
    },
    config.JWT_SECRET
  );

  return token;
};

export const verifyToken = (token: string) => {
  const { id, email } = jwt.verify(token, config.JWT_SECRET) as {
    id: string;
    email: string;
  };

  return { id, email };
};
