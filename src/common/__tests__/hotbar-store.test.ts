/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { anyObject } from "jest-mock-extended";
import { merge } from "lodash";
import mockFs from "mock-fs";
import logger from "../../main/logger";
import type { CatalogEntity, CatalogEntityData, CatalogEntityKindData } from "../catalog";
import { HotbarStore } from "../hotbar-store";
import { getDiForUnitTesting } from "../../main/getDiForUnitTesting";
import directoryForUserDataInjectable
  from "../app-paths/directory-for-user-data/directory-for-user-data.injectable";

jest.mock("../../main/catalog/catalog-entity-registry", () => ({
  catalogEntityRegistry: {
    items: [
      {
        metadata: {
          uid: "1dfa26e2ebab15780a3547e9c7fa785c",
          name: "mycluster",
          source: "local",
        },
      },
      {
        metadata: {
          uid: "55b42c3c7ba3b04193416cda405269a5",
          name: "my_shiny_cluster",
          source: "remote",
        },
      },
      {
        metadata: {
          uid: "catalog-entity",
          name: "Catalog",
          source: "app",
        },
      },
    ],
  },
}));

function getMockCatalogEntity(data: Partial<CatalogEntityData> & CatalogEntityKindData): CatalogEntity {
  return merge(data, {
    getName: jest.fn(() => data.metadata?.name),
    getId: jest.fn(() => data.metadata?.uid),
    getSource: jest.fn(() => data.metadata?.source ?? "unknown"),
    isEnabled: jest.fn(() => data.status?.enabled ?? true),
    onContextMenuOpen: jest.fn(),
    onSettingsOpen: jest.fn(),
    metadata: {},
    spec: {},
    status: {},
  }) as CatalogEntity;
}

const testCluster = getMockCatalogEntity({
  apiVersion: "v1",
  kind: "Cluster",
  status: {
    phase: "Running",
  },
  metadata: {
    uid: "test",
    name: "test",
    labels: {},
  },
});

const minikubeCluster = getMockCatalogEntity({
  apiVersion: "v1",
  kind: "Cluster",
  status: {
    phase: "Running",
  },
  metadata: {
    uid: "minikube",
    name: "minikube",
    labels: {},
  },
});

const awsCluster = getMockCatalogEntity({
  apiVersion: "v1",
  kind: "Cluster",
  status: {
    phase: "Running",
  },
  metadata: {
    uid: "aws",
    name: "aws",
    labels: {},
  },
});

describe("HotbarStore", () => {
  beforeEach(async () => {
    const di = getDiForUnitTesting({ doGeneralOverrides: true });

    di.override(directoryForUserDataInjectable, () => "some-directory-for-user-data");

    await di.runSetups();

    mockFs({
      "some-directory-for-user-data": {
        "lens-hotbar-store.json": JSON.stringify({}),
      },
    });

    HotbarStore.createInstance();
  });

  afterEach(() => {
    HotbarStore.resetInstance();
    mockFs.restore();
  });

  describe("load", () => {
    it("loads one hotbar by default", () => {
      expect(HotbarStore.getInstance().hotbars.length).toEqual(1);
    });
  });

  describe("add", () => {
    it("adds a hotbar", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.add({ name: "hottest" });
      expect(hotbarStore.hotbars.length).toEqual(2);
    });
  });

  describe("hotbar items", () => {
    it("initially creates 12 empty cells", () => {
      const hotbarStore = HotbarStore.getInstance();

      expect(hotbarStore.getActive().items.length).toEqual(12);
    });

    it("initially adds catalog entity as first item", () => {
      const hotbarStore = HotbarStore.getInstance();

      expect(hotbarStore.getActive().items[0].entity.name).toEqual("Catalog");
    });

    it("adds items", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      const items = hotbarStore.getActive().items.filter(Boolean);

      expect(items.length).toEqual(2);
    });

    it("removes items", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.removeFromHotbar("test");
      hotbarStore.removeFromHotbar("catalog-entity");
      const items = hotbarStore.getActive().items.filter(Boolean);

      expect(items).toStrictEqual([]);
    });

    it("does nothing if removing with invalid uid", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.removeFromHotbar("invalid uid");
      const items = hotbarStore.getActive().items.filter(Boolean);

      expect(items.length).toEqual(2);
    });

    it("moves item to empty cell", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.addToHotbar(minikubeCluster);
      hotbarStore.addToHotbar(awsCluster);

      expect(hotbarStore.getActive().items[6]).toBeNull();

      hotbarStore.restackItems(1, 5);

      expect(hotbarStore.getActive().items[5]).toBeTruthy();
      expect(hotbarStore.getActive().items[5].entity.uid).toEqual("test");
    });

    it("moves items down", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.addToHotbar(minikubeCluster);
      hotbarStore.addToHotbar(awsCluster);

      // aws -> catalog
      hotbarStore.restackItems(3, 0);

      const items = hotbarStore.getActive().items.map(item => item?.entity.uid || null);

      expect(items.slice(0, 4)).toEqual(["aws", "catalog-entity", "test", "minikube"]);
    });

    it("moves items up", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.addToHotbar(minikubeCluster);
      hotbarStore.addToHotbar(awsCluster);

      // test -> aws
      hotbarStore.restackItems(1, 3);

      const items = hotbarStore.getActive().items.map(item => item?.entity.uid || null);

      expect(items.slice(0, 4)).toEqual(["catalog-entity", "minikube", "aws", "test"]);
    });

    it("logs an error if cellIndex is out of bounds", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.add({ name: "hottest", id: "hottest" });
      hotbarStore.setActiveHotbar("hottest");

      const { error } = logger;
      const mocked = jest.fn();

      logger.error = mocked;

      hotbarStore.addToHotbar(testCluster, -1);
      expect(mocked).toBeCalledWith("[HOTBAR-STORE]: cannot pin entity to hotbar outside of index range", anyObject());

      hotbarStore.addToHotbar(testCluster, 12);
      expect(mocked).toBeCalledWith("[HOTBAR-STORE]: cannot pin entity to hotbar outside of index range", anyObject());

      hotbarStore.addToHotbar(testCluster, 13);
      expect(mocked).toBeCalledWith("[HOTBAR-STORE]: cannot pin entity to hotbar outside of index range", anyObject());

      logger.error = error;
    });

    it("throws an error if getId is invalid or returns not a string", () => {
      const hotbarStore = HotbarStore.getInstance();

      expect(() => hotbarStore.addToHotbar({} as any)).toThrowError(TypeError);
      expect(() => hotbarStore.addToHotbar({ getId: () => true } as any)).toThrowError(TypeError);
    });

    it("throws an error if getName is invalid or returns not a string", () => {
      const hotbarStore = HotbarStore.getInstance();

      expect(() => hotbarStore.addToHotbar({ getId: () => "" } as any)).toThrowError(TypeError);
      expect(() => hotbarStore.addToHotbar({ getId: () => "", getName: () => 4 } as any)).toThrowError(TypeError);
    });

    it("does nothing when item moved to same cell", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.restackItems(1, 1);

      expect(hotbarStore.getActive().items[1].entity.uid).toEqual("test");
    });

    it("new items takes first empty cell", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);
      hotbarStore.addToHotbar(awsCluster);
      hotbarStore.restackItems(0, 3);
      hotbarStore.addToHotbar(minikubeCluster);

      expect(hotbarStore.getActive().items[0].entity.uid).toEqual("minikube");
    });

    it("throws if invalid arguments provided", () => {
      // Prevent writing to stderr during this render.
      const { error, warn } = console;

      console.error = jest.fn();
      console.warn = jest.fn();

      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);

      expect(() => hotbarStore.restackItems(-5, 0)).toThrow();
      expect(() => hotbarStore.restackItems(2, -1)).toThrow();
      expect(() => hotbarStore.restackItems(14, 1)).toThrow();
      expect(() => hotbarStore.restackItems(11, 112)).toThrow();

      // Restore writing to stderr.
      console.error = error;
      console.warn = warn;
    });

    it("checks if entity already pinned to hotbar", () => {
      const hotbarStore = HotbarStore.getInstance();

      hotbarStore.addToHotbar(testCluster);

      expect(hotbarStore.isAddedToActive(testCluster)).toBeTruthy();
      expect(hotbarStore.isAddedToActive(awsCluster)).toBeFalsy();
    });
  });

  describe("pre beta-5 migrations", () => {
    beforeEach(() => {
      HotbarStore.resetInstance();
      const mockOpts = {
        "some-directory-for-user-data": {
          "lens-hotbar-store.json": JSON.stringify({
            __internal__: {
              migrations: {
                version: "5.0.0-beta.3",
              },
            },
            "hotbars": [
              {
                "id": "3caac17f-aec2-4723-9694-ad204465d935",
                "name": "myhotbar",
                "items": [
                  {
                    "entity": {
                      "uid": "1dfa26e2ebab15780a3547e9c7fa785c",
                    },
                  },
                  {
                    "entity": {
                      "uid": "55b42c3c7ba3b04193416cda405269a5",
                    },
                  },
                  {
                    "entity": {
                      "uid": "176fd331968660832f62283219d7eb6e",
                    },
                  },
                  {
                    "entity": {
                      "uid": "61c4fb45528840ebad1badc25da41d14",
                      "name": "user1-context",
                      "source": "local",
                    },
                  },
                  {
                    "entity": {
                      "uid": "27d6f99fe9e7548a6e306760bfe19969",
                      "name": "foo2",
                      "source": "local",
                    },
                  },
                  null,
                  {
                    "entity": {
                      "uid": "c0b20040646849bb4dcf773e43a0bf27",
                      "name": "multinode-demo",
                      "source": "local",
                    },
                  },
                  null,
                  null,
                  null,
                  null,
                  null,
                ],
              },
            ],
          }),
        },
      };

      mockFs(mockOpts);

      HotbarStore.createInstance();
    });

    afterEach(() => {
      mockFs.restore();
    });

    it("allows to retrieve a hotbar", () => {
      const hotbar = HotbarStore.getInstance().getById("3caac17f-aec2-4723-9694-ad204465d935");

      expect(hotbar.id).toBe("3caac17f-aec2-4723-9694-ad204465d935");
    });

    it("clears cells without entity", () => {
      const items = HotbarStore.getInstance().hotbars[0].items;

      expect(items[2]).toBeNull();
    });

    it("adds extra data to cells with according entity", () => {
      const items = HotbarStore.getInstance().hotbars[0].items;

      expect(items[0]).toEqual({
        entity: {
          name: "mycluster",
          source: "local",
          uid: "1dfa26e2ebab15780a3547e9c7fa785c",
        },
      });

      expect(items[1]).toEqual({
        entity: {
          name: "my_shiny_cluster",
          source: "remote",
          uid: "55b42c3c7ba3b04193416cda405269a5",
        },
      });
    });
  });
});