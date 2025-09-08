import { ApplicationsPage } from 'mod-arch-shared';
import React from 'react';

type MainPageProps = object;

const MainPage: React.FC<MainPageProps> = () => {
  const loadError = undefined;
  const loaded = true;

  return (
    <ApplicationsPage
      title="Main Page"
      description={<p>Welcome to the Main Page</p>}
      empty
      loadError={loadError}
      loaded={loaded}
      provideChildrenPadding
      removeChildrenTopPadding
    />
  );
};

export default MainPage;
