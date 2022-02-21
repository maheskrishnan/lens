/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import isAllowedResourceInjectable from "../../../common/utils/is-allowed-resource.injectable";
import { LimitRanges } from "./limit-ranges";
import { routeInjectionToken } from "../../routes/all-routes.injectable";

const limitRangesRouteInjectable = getInjectable({
  id: "limit-ranges-route",

  instantiate: (di) => {
    const isAllowedResource = di.inject(isAllowedResourceInjectable);

    return {
      Component: LimitRanges,
      path: "/limitranges",
      clusterFrame: true,
      mikko: () => isAllowedResource("limitranges"),
    };
  },

  injectionToken: routeInjectionToken,
});

export default limitRangesRouteInjectable;