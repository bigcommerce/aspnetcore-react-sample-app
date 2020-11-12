import React from "react";
import {
  Panel,
  Text,
  H0,
  H4,
  Box,
  ProgressCircle,
  Grid,
  GridItem,
} from "@bigcommerce/big-design";
import { ApiService } from "../services/apiService";

export default class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isCatalogSummaryLoading: true,
      isStoreInfoLoading: true,
      catalogSummary: {},
      storeInfo: {},
    };
  }

  UNSAFE_componentWillMount() {
    ApiService.getResourceEntry("v2/store").then(
      this.handleStoreInfoResponse.bind(this)
    );
    ApiService.getResourceEntry("v3/catalog/summary").then(
      this.handleCatalogSummaryResponse.bind(this)
    );
  }

  handleStoreInfoResponse(response) {
    this.setState({
      isStoreInfoLoading: false,
      storeInfo: response.data,
    });
  }

  handleCatalogSummaryResponse(response) {
    this.setState({
      isCatalogSummaryLoading: false,
      catalogSummary: response.data.data,
    });
  }

  render() {
    const fieldsInSummary = [
      {
        label: "Variant Count",
        index: "variant_count",
        format: "number",
      },
      {
        label: "Inventory Count",
        index: "inventory_count",
        format: "number",
      },
      {
        label: "Inventory Value",
        index: "inventory_value",
        format: "currency",
      },
    ];

    return (
      <React.Fragment>
        <Panel
          header="Store Overview"
          action={{
            variant: "secondary",
            text: "View Storefront",
            onClick: () => {
              location.href = this.state.storeInfo.secure_url;
            },
          }}
        >
          <Text bold={true}>
            A view into your default BigCommerce storefront.
          </Text>
          {this.state.isStoreInfoLoading ? (
            <ProgressCircle size="large" />
          ) : (
            <Box border="box" borderRadius="normal" padding="medium">
              <H4>Domain</H4>
              <Text color="secondary60">{this.state.storeInfo.domain}</Text>
            </Box>
          )}
        </Panel>
        <Panel header="Catalog Summary">
          <Text bold={true}>A simple overview of your catalog.</Text>
          {this.state.isStoreInfoLoading ? (
            <ProgressCircle size="large" />
          ) : (
            <Grid gridAutoFlow="column">
              {fieldsInSummary.map((field) => {
                return (
                  <GridItem key={field.index}>
                    <Box border="box" borderRadius="normal" padding="small">
                      <H4>{field.label}</H4>
                      <H0 color="secondary60">
                        {field.format === "currency"
                          ? new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: this.state.storeInfo.currency,
                            }).format(this.state.catalogSummary[field.index])
                          : this.state.catalogSummary[field.index]}
                      </H0>
                    </Box>
                  </GridItem>
                );
              })}
            </Grid>
          )}
        </Panel>
      </React.Fragment>
    );
  }
}
