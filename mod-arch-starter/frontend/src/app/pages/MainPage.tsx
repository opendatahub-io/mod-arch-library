import { ApplicationsPage } from 'mod-arch-shared';
import React from 'react';

const MainPage: React.FC = () => (
  <ApplicationsPage
    title="Main Page"
    description={<p>Welcome to the Main Page</p>}
    empty
    loaded
    provideChildrenPadding
    removeChildrenTopPadding
  />
);

export default MainPage;
