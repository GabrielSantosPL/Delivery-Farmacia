const UNINTENDED_PROFILE_NAME = 'Dr. Rogério Meireles';

export function removeAccidentalUserProfiles(users) {
  if (!Array.isArray(users)) return [];

  return users.filter(user => user?.name?.trim() !== UNINTENDED_PROFILE_NAME);
}
