import React from 'react';
import Home from "./home.jsx";
import { Tabs, Flex } from '@bigcommerce/big-design';

export default function Index () {
    const [activeTab, setActiveTab] = React.useState('tab1');

    const items = [
        { id: 'tab1', title: 'Home' },
        { id: 'tab2', title: 'List' }
    ];
        
        
    return <><Flex justifyContent="center"><Tabs activeTab={activeTab} items={items} onTabClick={setActiveTab} /></Flex>
            {activeTab === 'tab1' && <Home />}
            {activeTab === 'tab2' && <Home />}</>;
    }

