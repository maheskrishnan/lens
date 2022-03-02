/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import isAllowedResourceInjectable from "../../../common/utils/is-allowed-resource.injectable";
import { routeInjectionToken } from "../../routes/all-routes.injectable";

const daemonsetsRouteInjectable = getInjectable({
  id: "daemonsets-route",

  instantiate: (di) => {
    const isAllowedResource = di.inject(isAllowedResourceInjectable);

    return {
      path: "/daemonsets",
      clusterFrame: true,
      isEnabled: () => isAllowedResource("daemonsets"),
    };
  },

  injectionToken: routeInjectionToken,
});

export default daemonsetsRouteInjectable;