import OBR from "@owlbear-rodeo/sdk";
import { diffItems, toItemMap, Watcher, type ItemMap } from "owlbear-utils";
import { version } from "../package.json";
import { EXTENSION_NAME } from "./constants";
import { GradientWatcher } from "./tool/GradientWatcher";
import { installTool } from "./tool/tool";

export function install() {
    OBR.onReady(async () => {
        console.log(`${EXTENSION_NAME} version ${version}`);

        const watcher = new Watcher();
        watcher.addWatcher(GradientWatcher);
        let oldItems: ItemMap = new Map();
        OBR.scene.items.onChange(async (items) => {
            const newItems = toItemMap(items);
            const diff = diffItems(oldItems, newItems);
            oldItems = newItems;
            await watcher.handleGlobalItemsUpdate(diff);
        });

        await installTool(watcher);
    });
}
