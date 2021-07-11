import * as yup from "yup";

export const registerSchema = yup
  .object()
  .shape({
    email: yup.string().required().email(),
    multiSigAddress: yup.string().required(),
    clientAddress: yup.string().required(),
    userId: yup.string().required(),
  })
  .required();

export const recoverSchema = yup
  .object()
  .shape({
    validateEmailToken: yup.string().required(),
    email: yup.string().required().email(),
    newClientAddress: yup.string().required(),
  })
  .required();

export const resetSchema = yup
  .object()
  .shape({
    email: yup.string().required().email(),
  })
  .required();

export const removeAndFetchSchema = yup
  .object()
  .shape({
    userId: yup.string().required(),
  })
  .required();

export const updateSchema = yup
  .object()
  .shape({
    userId: yup.string().required(),
    data: yup.object().required(),
  })
  .required();
