/** Tiny pub/sub that links charts sharing a `syncId` (crosshair and optionally visible range). */
export type SyncMessage = { type: "crosshair"; time: number | null } | { type: "range"; from: number; to: number };

type Member = { owner: object; handler: (m: SyncMessage) => void };

const groups = new Map<string, Set<Member>>();

const join = (id: string, owner: object, handler: (m: SyncMessage) => void) => {
    let group = groups.get(id);
    if (!group) {
        group = new Set();
        groups.set(id, group);
    }
    const member = { owner, handler };
    group.add(member);
    return () => {
        group!.delete(member);
        if (group!.size === 0) {
            groups.delete(id);
        }
    };
};

const publish = (id: string, sender: object, message: SyncMessage) => {
    for (const member of groups.get(id) ?? []) {
        if (member.owner !== sender) {
            member.handler(message);
        }
    }
};

export const joinSync = Object.assign(join, { publish });
