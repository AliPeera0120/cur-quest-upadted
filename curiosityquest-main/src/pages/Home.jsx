import React from 'react';
import HeroSection from '../components/home/HeroSection';
import WhatIsCQ from '../components/home/WhatIsCQ';
import WhatWeDo from '../components/home/WhatWeDo';
import WhoItsFor from '../components/home/WhoItsFor';
import ContributeSection from '../components/home/ContributeSection';
import OurTeam from '../components/home/OurTeam';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <WhatIsCQ />
      <OurTeam />
      <WhatWeDo />
      <WhoItsFor />
      <ContributeSection />
    </div>
  );
}