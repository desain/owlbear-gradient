import OBR from "@owlbear-rodeo/sdk";
import type { Watcher } from "owlbear-utils";
import { BucketMode } from "./BucketMode";

export async function installTool(watcher: Watcher) {
    await Promise.all([OBR.tool.createMode(new BucketMode(watcher))]);
}
