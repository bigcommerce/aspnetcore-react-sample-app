import React from "react";
import Home from "./home.jsx";
import List from "./list.jsx";
import { Tabs, H0, Box, GlobalStyles } from "@bigcommerce/big-design";

export default function Index() {
  const [activeTab, setActiveTab] = React.useState("tab1");

  const items = [
    { id: "tab1", title: <b>Summary</b> },
    { id: "tab2", title: <b>Orders List</b> },
  ];

  return (
    <div style={{ height: "100vh", backgroundColor: "#ECEEF5" }}>
      <GlobalStyles />
      <Box
        backgroundColor="secondary20"
        borderRadius="normal"
        padding="xxxLarge"
        paddingBottom="none"
      >
        <H0>Sample App</H0>
        <Tabs
          backgroundColor="secondary20"
          borderRadius="normal"
          activeTab={activeTab}
          items={items}
          onTabClick={setActiveTab}
        />
      </Box>
      <Box
        backgroundColor="secondary20"
        border="box"
        borderBottom="none"
        borderRadius="normal"
        padding="medium"
      >
        {activeTab === "tab1" && <Home />}
        {activeTab === "tab2" && <List />}
      </Box>
    </div>
  );
}
