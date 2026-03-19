export type SystemConfig = {
  id: string;
  configKey: string;
  configValue?: string | null;
  groupName?: string | null;
};

export type SystemConfigInput = {
  configKey: string;
  configValue?: string;
  groupName?: string;
};
