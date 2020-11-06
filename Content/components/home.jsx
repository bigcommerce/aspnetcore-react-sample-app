import React from 'react';
import { ProgressCircle, Box, Panel, Flex, FlexItem, H2, H3 } from '@bigcommerce/big-design';
import { ApiService } from '../services/apiService';

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
        ApiService.getResourceEntry('v2/store').then(this.handleStoreInfoResponse.bind(this));
        ApiService.getResourceEntry('v3/catalog/summary').then(this.handleCatalogSummaryResponse.bind(this));
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
            <div className="container">
               <div className="row">
                   <div className="col-md-8">

                       <Box backgroundColor="secondary10" border="box" borderRadius="normal" padding="medium">
                            <H2>Home Page</H2>
                        </Box>

                        <Box backgroundColor="white" border="box" borderRadius="normal" padding="medium">
                               {
                                   (this.state.isStoreInfoLoading || this.state.isCatalogSummaryLoading)
                                       ?
                                       <ProgressCircle size="large" />
                                       :
                                       <Flex
                                        alignContent="stretch"
                                        alignItems="stretch"
                                        flexDirection="row"
                                        justifyContent="flex-start"
                                        flexWrap="wrap"
                                        >
                                           {fieldsInSummary.map(function (summaryItem) {
                                               return <FlexItem key={summaryItem.index} alignSelf="auto" flexBasis="30%" margin="large" >
                                                   <Panel header={summaryItem.label} padding="xxSmall">
                                                        <H3>
                                                    {
                                                    summaryItem.format === 'currency'
                                                        ?
                                                        new Intl.NumberFormat(undefined, { style: 'currency', currency: this.state.storeInfo.currency }).format(this.state.catalogSummary[summaryItem.index])
                                                        :
                                                        this.state.catalogSummary[summaryItem.index]
                                                                       }
                                                        </H3>
                                                    </Panel>
                                                </FlexItem>
                                           }.bind(this))}
                                       </Flex>
                               }
                           </Box>
                       
                   </div>
                   <div className="col-md-4">
                       <div className="card">
                       <Box backgroundColor="secondary10" border="box" borderRadius="normal" padding="medium">
                            <H2>Side Bar</H2>
                        </Box>

                        <Box backgroundColor="white" border="box" borderRadius="normal" padding="medium">
                               {
                                   this.state.isStoreInfoLoading
                                       ?
                                       <ProgressCircle size="large" />
                                       :
                                       <section>
                                           {
                                               this.state.storeInfo.logo.url
                                                   ?
                                                   <img src={this.state.storeInfo.logo.url} className="img-fluid img-thumbnail" />
                                                   :
                                                   <h5>{this.state.storeInfo.name}</h5>
                                           }

                                           <ul className="list-group">
                                               <li className="list-group-item">
                                                   <div className="d-flex w-100 justify-content-between">
                                                       <h5 className="mb-1">Domain</h5>
                                                   </div>
                                                   <p className="mb-1">{this.state.storeInfo.domain}</p>
                                               </li>
                                               <li className="list-group-item">
                                                   <div className="d-flex w-100 justify-content-between">
                                                       <h5 className="mb-1">Secure URL</h5>
                                                   </div>
                                                   <p className="mb-1">{this.state.storeInfo.secure_url}</p>
                                               </li>
                                           </ul>

                                       </section>
                               }
                           </Box>
                       </div>
                   </div>
               </div>
            </div>
        );
    }
}
