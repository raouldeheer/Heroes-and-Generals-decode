import * as interfaces from "../interfaces";

export type LongToString<T> = {
    [P in keyof T]: T[P] extends Array<infer AT>
    ? Array<LongToString<AT>>
    : T[P] extends Long ? string
    : T[P] extends (string | number | boolean) ? T[P]
    : LongToString<T[P]>
};

export type KeyValueSet = (typeof KeyValueClass)[KeyValueClassKeys];
export type KeyValueDelete = {
    key: KeyValueClassKeys,
    value: string,
};

export interface IKeyValueChangeSetResult {
    set?: KeyValueSet[],
    delete?: KeyValueDelete[],
}

export const enum KeyValueOp {
    set = "set",
    delete = "delete"
}

export const enum KeyValueChangeKey {
    HostingCenterInfo = "HostingCenterInfo",
    CommandNodeDefinition = "CommandNodeDefinition",
    CommandNodeWarInstance = "CommandNodeWarInstance",
    armyresource = "armyresource",
    PlayerPartnerInfo = "PlayerPartnerInfo",
    player = "player",
    PlayerOfferMetrics = "PlayerOfferMetrics",
    StoreDiscount = "StoreDiscount",
    StoreCampaign = "StoreCampaign",
    BattleInfo = "BattleInfo",
    FactionResourceProduction = "FactionResourceProduction",
    FactionResourceConsumption = "FactionResourceConsumption",
    MessageRecipient = "MessageRecipient",
    ignoredplayerwithname = "ignoredplayerwithname",
    ShopWarBondItemCounter = "ShopWarBondItemCounter",
    friendinfo = "friendinfo",
    FactionResourceQueue = "FactionResourceQueue",
    supplylinestatus = "supplylinestatus",
    accesspointstatus = "accesspointstatus",
    accesspointtemplate = "accesspointtemplate",
    transport_commandnode_segment = "transport_commandnode_segment",
    transport_commandnode_destination = "transport_commandnode_destination",
    air_transport = "air_transport",
    air_commandnode_base = "air_commandnode_base",
    battle = "battle",
    ViewHandlerPulse = "ViewHandlerPulse",
    faction = "faction",
    war = "war",
    battlefieldstatus = "battlefieldstatus",
    battlefield = "battlefield",
    battle_pass = "battle_pass",
    DailyBonus = "DailyBonus",
    Squad = "Squad",
    missionresource = "missionresource",
    RibbonBooster = "RibbonBooster",
    NotificationData = "NotificationData",
    Notification = "Notification",
    UnlockNotification = "UnlockNotification",
    VehicleAmmo = "VehicleAmmo",
    VehicleUpgrade = "VehicleUpgrade",
    UniformPart = "UniformPart",
    WeaponModifier = "WeaponModifier",
    WeaponVariant = "WeaponVariant",
    WeaponAmmo = "WeaponAmmo",
    character = "character",
    weapon = "weapon",
    Vehicle = "Vehicle",
    SquadSession = "SquadSession",
    SquadMemberSession = "SquadMemberSession",
    PlayerMatchMaking = "PlayerMatchMaking",
    PlayerGoldOffer = "PlayerGoldOffer",
    PlayerMembershipItem = "PlayerMembershipItem",
    accesspoint = "accesspoint",
    supplyline = "supplyline",
    CommandNodeSupplyQueueItem = "CommandNodeSupplyQueueItem",
    CommandNodeSupplyQueueItemTicket = "CommandNodeSupplyQueueItemTicket",
    armyresourcecategory = "armyresourcecategory",
    CommandNodeMorale = "CommandNodeMorale",
    capital = "capital",
}

const getDefaultKeyValue = <K extends KeyValueChangeKey, V extends Record<string, any>>() => ({
    key: null as unknown as K,
    value: null as unknown as V,
} as const);

export type KeyValueClassKeys = keyof typeof KeyValueClass;
export const KeyValueClass = {
    [KeyValueChangeKey.HostingCenterInfo]: getDefaultKeyValue<KeyValueChangeKey.HostingCenterInfo, interfaces.HostingCenterInfo>(),
    [KeyValueChangeKey.CommandNodeDefinition]: getDefaultKeyValue<KeyValueChangeKey.CommandNodeDefinition, interfaces.CommandNodeDefinition>(),
    [KeyValueChangeKey.CommandNodeWarInstance]: getDefaultKeyValue<KeyValueChangeKey.CommandNodeWarInstance, interfaces.CommandNodeWarInstance>(),
    [KeyValueChangeKey.armyresource]: getDefaultKeyValue<KeyValueChangeKey.armyresource, interfaces.armyresource>(),
    [KeyValueChangeKey.PlayerPartnerInfo]: getDefaultKeyValue<KeyValueChangeKey.PlayerPartnerInfo, interfaces.PlayerPartnerInfo>(),
    [KeyValueChangeKey.player]: getDefaultKeyValue<KeyValueChangeKey.player, interfaces.player>(),
    [KeyValueChangeKey.PlayerOfferMetrics]: getDefaultKeyValue<KeyValueChangeKey.PlayerOfferMetrics, interfaces.PlayerOfferMetrics>(),
    [KeyValueChangeKey.StoreDiscount]: getDefaultKeyValue<KeyValueChangeKey.StoreDiscount, interfaces.StoreDiscount>(),
    [KeyValueChangeKey.StoreCampaign]: getDefaultKeyValue<KeyValueChangeKey.StoreCampaign, interfaces.StoreCampaign>(),
    [KeyValueChangeKey.BattleInfo]: getDefaultKeyValue<KeyValueChangeKey.BattleInfo, interfaces.BattleInfo>(),
    [KeyValueChangeKey.FactionResourceProduction]: getDefaultKeyValue<KeyValueChangeKey.FactionResourceProduction, interfaces.FactionResourceProduction>(),
    [KeyValueChangeKey.FactionResourceConsumption]: getDefaultKeyValue<KeyValueChangeKey.FactionResourceConsumption, interfaces.FactionResourceConsumption>(),
    [KeyValueChangeKey.MessageRecipient]: getDefaultKeyValue<KeyValueChangeKey.MessageRecipient, interfaces.MessageRecipient>(),
    [KeyValueChangeKey.ignoredplayerwithname]: getDefaultKeyValue<KeyValueChangeKey.ignoredplayerwithname, interfaces.ignoredplayerwithname>(),
    [KeyValueChangeKey.ShopWarBondItemCounter]: getDefaultKeyValue<KeyValueChangeKey.ShopWarBondItemCounter, interfaces.ShopWarBondItemCounter>(),
    [KeyValueChangeKey.friendinfo]: getDefaultKeyValue<KeyValueChangeKey.friendinfo, interfaces.friendinfo>(),
    [KeyValueChangeKey.FactionResourceQueue]: getDefaultKeyValue<KeyValueChangeKey.FactionResourceQueue, interfaces.FactionResourceQueue>(),
    [KeyValueChangeKey.supplylinestatus]: getDefaultKeyValue<KeyValueChangeKey.supplylinestatus, interfaces.supplylinestatus>(),
    [KeyValueChangeKey.accesspointstatus]: getDefaultKeyValue<KeyValueChangeKey.accesspointstatus, interfaces.accesspointstatus>(),
    [KeyValueChangeKey.accesspointtemplate]: getDefaultKeyValue<KeyValueChangeKey.accesspointtemplate, interfaces.accesspointtemplate>(),
    [KeyValueChangeKey.transport_commandnode_segment]: getDefaultKeyValue<KeyValueChangeKey.transport_commandnode_segment, interfaces.transport_commandnode_segment>(),
    [KeyValueChangeKey.transport_commandnode_destination]: getDefaultKeyValue<KeyValueChangeKey.transport_commandnode_destination, interfaces.transport_commandnode_destination>(),
    [KeyValueChangeKey.air_transport]: getDefaultKeyValue<KeyValueChangeKey.air_transport, interfaces.air_transport>(),
    [KeyValueChangeKey.air_commandnode_base]: getDefaultKeyValue<KeyValueChangeKey.air_commandnode_base, interfaces.air_commandnode_base>(),
    [KeyValueChangeKey.battle]: getDefaultKeyValue<KeyValueChangeKey.battle, interfaces.battle>(),
    [KeyValueChangeKey.ViewHandlerPulse]: getDefaultKeyValue<KeyValueChangeKey.ViewHandlerPulse, interfaces.ViewHandlerPulse>(),
    [KeyValueChangeKey.faction]: getDefaultKeyValue<KeyValueChangeKey.faction, interfaces.faction>(),
    [KeyValueChangeKey.war]: getDefaultKeyValue<KeyValueChangeKey.war, interfaces.war>(),
    [KeyValueChangeKey.battlefieldstatus]: getDefaultKeyValue<KeyValueChangeKey.battlefieldstatus, interfaces.battlefieldstatus>(),
    [KeyValueChangeKey.battlefield]: getDefaultKeyValue<KeyValueChangeKey.battlefield, interfaces.battlefield>(),
    [KeyValueChangeKey.battle_pass]: getDefaultKeyValue<KeyValueChangeKey.battle_pass, interfaces.battle_pass>(),
    [KeyValueChangeKey.DailyBonus]: getDefaultKeyValue<KeyValueChangeKey.DailyBonus, interfaces.DailyBonus>(),
    [KeyValueChangeKey.Squad]: getDefaultKeyValue<KeyValueChangeKey.Squad, interfaces.Squad>(),
    [KeyValueChangeKey.missionresource]: getDefaultKeyValue<KeyValueChangeKey.missionresource, interfaces.missionresource>(),
    [KeyValueChangeKey.RibbonBooster]: getDefaultKeyValue<KeyValueChangeKey.RibbonBooster, interfaces.RibbonBooster>(),
    [KeyValueChangeKey.NotificationData]: getDefaultKeyValue<KeyValueChangeKey.NotificationData, interfaces.NotificationData>(),
    [KeyValueChangeKey.Notification]: getDefaultKeyValue<KeyValueChangeKey.Notification, interfaces.Notification>(),
    [KeyValueChangeKey.UnlockNotification]: getDefaultKeyValue<KeyValueChangeKey.UnlockNotification, interfaces.UnlockNotification>(),
    [KeyValueChangeKey.VehicleAmmo]: getDefaultKeyValue<KeyValueChangeKey.VehicleAmmo, interfaces.VehicleAmmo>(),
    [KeyValueChangeKey.VehicleUpgrade]: getDefaultKeyValue<KeyValueChangeKey.VehicleUpgrade, interfaces.VehicleUpgrade>(),
    [KeyValueChangeKey.UniformPart]: getDefaultKeyValue<KeyValueChangeKey.UniformPart, interfaces.UniformPart>(),
    [KeyValueChangeKey.WeaponModifier]: getDefaultKeyValue<KeyValueChangeKey.WeaponModifier, interfaces.WeaponModifier>(),
    [KeyValueChangeKey.WeaponVariant]: getDefaultKeyValue<KeyValueChangeKey.WeaponVariant, interfaces.WeaponVariant>(),
    [KeyValueChangeKey.WeaponAmmo]: getDefaultKeyValue<KeyValueChangeKey.WeaponAmmo, interfaces.WeaponAmmo>(),
    [KeyValueChangeKey.character]: getDefaultKeyValue<KeyValueChangeKey.character, interfaces.character>(),
    [KeyValueChangeKey.weapon]: getDefaultKeyValue<KeyValueChangeKey.weapon, interfaces.weapon>(),
    [KeyValueChangeKey.Vehicle]: getDefaultKeyValue<KeyValueChangeKey.Vehicle, interfaces.Vehicle>(),
    [KeyValueChangeKey.SquadSession]: getDefaultKeyValue<KeyValueChangeKey.SquadSession, interfaces.SquadSession>(),
    [KeyValueChangeKey.SquadMemberSession]: getDefaultKeyValue<KeyValueChangeKey.SquadMemberSession, interfaces.SquadMemberSession>(),
    [KeyValueChangeKey.PlayerMatchMaking]: getDefaultKeyValue<KeyValueChangeKey.PlayerMatchMaking, interfaces.PlayerMatchMaking>(),
    [KeyValueChangeKey.PlayerGoldOffer]: getDefaultKeyValue<KeyValueChangeKey.PlayerGoldOffer, interfaces.PlayerGoldOffer>(),
    [KeyValueChangeKey.PlayerMembershipItem]: getDefaultKeyValue<KeyValueChangeKey.PlayerMembershipItem, interfaces.PlayerMembershipItem>(),
    [KeyValueChangeKey.accesspoint]: getDefaultKeyValue<KeyValueChangeKey.accesspoint, interfaces.accesspoint>(),
    [KeyValueChangeKey.supplyline]: getDefaultKeyValue<KeyValueChangeKey.supplyline, interfaces.supplyline>(),
    [KeyValueChangeKey.CommandNodeSupplyQueueItem]: getDefaultKeyValue<KeyValueChangeKey.CommandNodeSupplyQueueItem, interfaces.CommandNodeSupplyQueueItem>(),
    [KeyValueChangeKey.CommandNodeSupplyQueueItemTicket]: getDefaultKeyValue<KeyValueChangeKey.CommandNodeSupplyQueueItemTicket, interfaces.CommandNodeSupplyQueueItemTicket>(),
    [KeyValueChangeKey.armyresourcecategory]: getDefaultKeyValue<KeyValueChangeKey.armyresourcecategory, interfaces.armyresourcecategory>(),
    [KeyValueChangeKey.CommandNodeMorale]: getDefaultKeyValue<KeyValueChangeKey.CommandNodeMorale, interfaces.CommandNodeMorale>(),
    [KeyValueChangeKey.capital]: getDefaultKeyValue<KeyValueChangeKey.capital, interfaces.capital>(),
} as const;

