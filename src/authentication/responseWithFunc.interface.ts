import { Response } from "express";
export default interface ResponseWithFunc extends Response {
  setAuthCookies: (arg1: string) => Response;
}
