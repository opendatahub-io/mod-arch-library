import { ApplicationsPage } from 'mod-arch-shared';
import React from 'react';

type SettingsMainPageProps = object;

const SettingsMainPage: React.FC<SettingsMainPageProps> = () => {
  const loadError = undefined;
  const loaded = true;

  return (
    <ApplicationsPage
      title="Settings Page"
      description={<p>Welcome to the Settings Page</p>}
      empty
      loadError={loadError}
      loaded={loaded}
      provideChildrenPadding
      removeChildrenTopPadding
    />
  );
};

export default SettingsMainPage;
