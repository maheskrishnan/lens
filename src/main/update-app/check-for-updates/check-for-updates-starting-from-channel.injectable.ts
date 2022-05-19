/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import type { UpdateChannel } from "../update-channels";
import checkForPlatformUpdatesInjectable from "../check-for-platform-updates/check-for-platform-updates.injectable";

interface CheckForUpdatesFromChannelResult {
  updateWasDiscovered: boolean;
  version?: string;
  actualUpdateChannel?: UpdateChannel;
}

const checkForUpdatesStartingFromChannelInjectable = getInjectable({
  id: "check-for-updates-starting-from-channel",

  instantiate: (di) => {
    const checkForPlatformUpdates = di.inject(
      checkForPlatformUpdatesInjectable,
    );

    const _recursiveCheck = async (
      updateChannel: UpdateChannel,
    ): Promise<CheckForUpdatesFromChannelResult> => {
      const result = await checkForPlatformUpdates(updateChannel);

      if (result.updateWasDiscovered) {
        return {
          updateWasDiscovered: true,
          version: result.version,
          actualUpdateChannel: updateChannel,
        };
      }

      if (updateChannel.moreStableUpdateChannel) {
        return await _recursiveCheck(updateChannel.moreStableUpdateChannel);
      }

      return { updateWasDiscovered: false };
    };

    return _recursiveCheck;
  },
});

export default checkForUpdatesStartingFromChannelInjectable;
