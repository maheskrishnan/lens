/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import routesInjectable from "./routes.injectable";
import { computed } from "mobx";
import { matchPath } from "react-router";
import currentPathInjectable from "./current-path.injectable";

const matchingRouteInjectable = getInjectable({
  id: "matching-route",

  instantiate: (di) => {
    const routes = di.inject(routesInjectable);
    const currentPath = di.inject(currentPathInjectable);

    return computed(() => {
      const allRoutes = routes.get();
      const current = currentPath.get();

      for (const route of allRoutes) {
        const matchResult = matchPath(current, {
          path: route.path,
          exact: true,
        });

        if (matchResult) {
          return {
            route,
            pathParameters: matchResult.params,
          };
        }
      }

      return undefined;
    });
  },
});

export default matchingRouteInjectable;
