import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

export interface ControllerDeps {
  prisma: PrismaClient
}

export type Controller = (dependencies: ControllerDeps) => {
  path: string
  router: Router
}