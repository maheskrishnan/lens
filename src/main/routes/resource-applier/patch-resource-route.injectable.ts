/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { routeInjectionToken } from "../../router/router.injectable";
import type { LensApiRequest, LensApiResult } from "../../router";
import { apiPrefix } from "../../../common/vars";
import { ResourceApplier } from "../../resource-applier";

const patchResourceRouteInjectable = getInjectable({
  id: "patch-resource-route",

  instantiate: () => ({
    method: "patch",
    path: `${apiPrefix}/stack`,

    handler: async ({
      cluster,
      payload,
    }: LensApiRequest): Promise<LensApiResult> => ({
      response: await new ResourceApplier(cluster).patch(
        payload.name,
        payload.kind,
        payload.patch,
        payload.ns,
      ),
    }),
  }),

  injectionToken: routeInjectionToken,
});

export default patchResourceRouteInjectable;