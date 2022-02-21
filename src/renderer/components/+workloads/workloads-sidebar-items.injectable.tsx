/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, getInjectionToken } from "@ogre-tools/injectable";
import { computed, IComputedValue } from "mobx";
import { sidebarItemsInjectionToken } from "../layout/sidebar-items.injectable";
import { Icon } from "../icon";
import React from "react";
import type { ISidebarItem } from "../layout/sidebar";
import { some } from "lodash/fp";

export const workloadsChildSidebarItemsInjectionToken = getInjectionToken<IComputedValue<ISidebarItem[]>>({
  id: "workloads-child-sidebar-items-injection-token",
});

const workloadsSidebarItemsInjectable = getInjectable({
  id: "workloads-sidebar-items",

  instantiate: (di) => {
    const childSidebarItems = di.injectMany(
      workloadsChildSidebarItemsInjectionToken,
    );

    return computed(() => {
      const parentId = "workloads";

      const childItems = childSidebarItems
        .flatMap((items) => items.get())
        .map((item) => ({ ...item, parentId }));

      return [
        {
          id: parentId,
          title: "Workloads",
          getIcon: () => <Icon svg="workloads" />,
          url: `asd`,
          isActive: some({ isActive: true }, childItems),
          isVisible: some({ isVisible: true }, childItems),
        },

        ...childItems,
      ];
    });
  },

  injectionToken: sidebarItemsInjectionToken,
});

export default workloadsSidebarItemsInjectable;