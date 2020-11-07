import React from 'react';
import { Table } from './table.jsx';
import { ProgressBar, Button, Text } from '@bigcommerce/big-design';
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
            label: "Order ID",
            index: "id",
            callback: function(orderId) {
              return orderId;
            },
          },
          {
            label: "Billing Name",
            index: "billing_address",
            callback: function(billingAddress) {
              return `${billingAddress.first_name} ${billingAddress.last_name}`;
            },
          },
          {
            label: "Order Total",
            index: "total_inc_tax",
            callback: function(orderTotal) {
              return orderTotal;
            },
          },
          {
            label: "Order Status",
            callback: function(data) {
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
            label: "Actions",
            callback: function(data) {
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
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="card">
                <div className="card-header">List Orders</div>

                <div className="card-body">
                  {
                    this.state.isOrdersLoading
                    ? 
                    <ProgressBar />
                    :
                    this.hasOrders()
                    ? 
                    <section>
                      <Table tableHeaders={this.state.tableHeaders} tableData={this.state.orders.data} />
                    </section>
                    : 
                    <section>
                      <div className="emptyTable">No orders exist yet!</div>
                    </section>
                  }
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
