import * as yup from "yup";

export const createSchema = yup
  .object()
  .shape({
    link: yup.string().required(),
  })
  .required();

export const reservedSchema = yup
  .object()
  .shape({
    link: yup.string().required(),
    route: yup.string().required(),
  })
  .required();

export const removeSchema = yup
  .object()
  .shape({
    id: yup.string().required(),
  })
  .required();
