import React from 'react';
import { ProgressBar, Button, Text, Table, Box, H2 } from '@bigcommerce/big-design';
import {ApiService} from '../services/apiService';

export default class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOrdersLoading: true,
      orders: {
        data: [],
        pagination: {},
      },
      tableHeaders:
        [
          {
            header: "Order ID",
            hash: "id",
            render: ({id}) => id,
          },
          {
            header: "Billing Name",
            hash: "billing_address",
            render: function({billing_address}) {
              return `${billing_address.first_name} ${billing_address.last_name}`;
            },
          },
          {
            header: "Order Total",
            hash: "total_inc_tax",
            render: function({total_inc_tax}) {
              return total_inc_tax;
            },
          },
          {
            header: "Order Status",
            hash: "order_status",
            render: function(data) {
              let color;
              if (data.status_id === 5) {
                color = 'danger';
              } else if (data.status_id === 2 || data.status_id === 10) {
                color = 'success';
              } else {
                color = 'secondary';
              }

              return (
                <Text color={color}>{ data.status }</Text>
              );
            },
          },
          {
            header: "Actions",
            hash: "actions",
            render: function(data) {
              if (data.status_id !== 5) {
                return (
                  <Button actionType="destructive" onClick={(e) => this.cancelOrder(data.id, e)}>Cancel</Button>
                );
              }
            }.bind(this),
          },
        ],
    };
  }

  UNSAFE_componentWillMount() {
    this.loadOrders();
  }

  loadOrders() {
    ApiService.getOrders({
      limit: 5
    }).then(this.handleOrdersResponse.bind(this));
  }

  handleOrdersResponse(response) {
    this.setState({
      isOrdersLoading: false,
      orders: {
        data: response.data
      }
    });
  }

  cancelOrder(orderId) {
  	const newOrderData = { status_id: 5 };

    this.setState({
      isOrdersLoading: true,
    });
  	
    ApiService.updateOrder(orderId, newOrderData)
    .then(this.loadOrders.bind(this));
  }

  hasOrders() {
    return (this.state.orders.data.length > 0);
  }

  render() {
    console.log("columns", this.state.tableHeaders);
    console.log("items", this.state.orders.data);
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="card">
                <Box backgroundColor="secondary10" border="box" borderRadius="normal" padding="medium">
                    <H2>List Orders</H2>
                  </Box>

                  <Box backgroundColor="white" border="box" borderRadius="normal" padding="medium">
                  {
                    this.state.isOrdersLoading
                    ? 
                    <ProgressBar />
                    :
                    this.hasOrders()
                    ? 
                    <section>
                      <Table columns={this.state.tableHeaders} items={this.state.orders.data} />
                    </section>
                    : 
                    <section>
                      <div className="emptyTable">No orders exist yet!</div>
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
