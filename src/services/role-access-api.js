import api from "./axios-config";

const ROLE_ACCESS_CACHE_KEY = "roleAccessControlSchedules";

const normalizeSetting = (setting) => ({
  ...setting,
  role: String(setting.role || "").toUpperCase(),
  isLoginEnabled: Boolean(setting.isLoginEnabled),
});

const cacheSettings = (settings) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLE_ACCESS_CACHE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Storage can be unavailable in private browsing; the API remains authoritative.
  }
};

const cacheSetting = (setting) => {
  if (typeof window === "undefined") return;
  try {
    const cached = JSON.parse(
      localStorage.getItem(ROLE_ACCESS_CACHE_KEY) || "[]",
    );
    const next = cached.filter((item) => item.role !== setting.role);
    cacheSettings([...next, setting]);
  } catch (error) {
    cacheSettings([setting]);
  }
};

export const getCachedActiveRoleSchedule = () => {
  if (typeof window === "undefined") return null;
  try {
    const settings = JSON.parse(
      localStorage.getItem(ROLE_ACCESS_CACHE_KEY) || "[]",
    );
    return (
      settings
        .filter(
          (setting) =>
            setting.isScheduled &&
            setting.scheduledEndTime &&
            new Date(setting.scheduledEndTime).getTime() > Date.now(),
        )
        .sort(
          (first, second) =>
            new Date(first.scheduledEndTime).getTime() -
            new Date(second.scheduledEndTime).getTime(),
        )[0] || null
    );
  } catch (error) {
    return null;
  }
};

export const getRoleAccessControls = async () => {
  const response = await api.get("/Auth/role-access-controls");
  const settings = Array.isArray(response.data)
    ? response.data.map(normalizeSetting)
    : [];
  cacheSettings(settings);
  return settings;
};

export const getRoleAccessControl = async (role) => {
  const response = await api.get(`/Auth/role-access-controls/${role}`);
  const setting = normalizeSetting(response.data);
  cacheSetting(setting);
  return setting;
};

export const updateRoleAccessControl = async (
  role,
  { isLoginEnabled, disabledMessage, changeReason },
) => {
  const response = await api.put(`/Auth/role-access-controls/${role}`, {
    isLoginEnabled,
    disabledMessage: disabledMessage || null,
    changeReason: changeReason || null,
  });
  const setting = normalizeSetting(response.data);
  cacheSetting(setting);
  return setting;
};

export const scheduleRoleAccessControl = async (
  role,
  { scheduledStartTime, scheduledEndTime, disabledMessage, scheduledReason },
) => {
  const response = await api.put(
    `/Auth/role-access-controls/${role}/schedule`,
    {
      scheduledStartTime,
      scheduledEndTime,
      disabledMessage: disabledMessage || null,
      scheduledReason: scheduledReason || null,
    },
  );
  const setting = normalizeSetting(response.data);
  cacheSetting(setting);
  return setting;
};

export const cancelRoleAccessSchedule = async (role) => {
  const response = await api.delete(
    `/Auth/role-access-controls/${role}/schedule`,
  );
  const setting = normalizeSetting(response.data);
  cacheSetting(setting);
  return setting;
};
