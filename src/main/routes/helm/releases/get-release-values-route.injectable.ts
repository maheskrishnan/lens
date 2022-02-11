/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { apiPrefix } from "../../../../common/vars";
import type { LensApiRequest, LensApiResult } from "../../../router";
import { helmService } from "../../../helm/helm-service";
import { routeInjectionToken } from "../../../router/router.injectable";
import { getInjectable } from "@ogre-tools/injectable";
import { getBoolean } from "../../../utils/parse-query";
import { contentTypes } from "../../../router";

const getReleaseRouteValuesInjectable = getInjectable({
  id: "get-release-values-route",

  instantiate: () => ({
    method: "get",
    path: `${apiPrefix}/v2/releases/{namespace}/{release}/values`,

    handler: async (request: LensApiRequest): Promise<LensApiResult> => {
      const { cluster, params: { namespace, release }, query } = request;
      const all = getBoolean(query, "all");

      return {
        response: await helmService.getReleaseValues(release, {
          cluster,
          namespace,
          all,
        }),

        contentType: contentTypes.txt,
      };
    },
  }),

  injectionToken: routeInjectionToken,
});

export default getReleaseRouteValuesInjectable;