import React, { useState, useEffect } from "react";
import {
  ProgressBar,
  Button,
  Text,
  Table,
  Panel,
} from "@bigcommerce/big-design";
import { ApiService } from "../services/apiService";

const List = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const tableHeaders = [
    {
      header: "Order ID",
      hash: "id",
      render: ({ id }) => id,
    },
    {
      header: "Billing Name",
      hash: "billing_address",
      render: function ({ billing_address }) {
        return `${billing_address.first_name} ${billing_address.last_name}`;
      },
    },
    {
      header: "Order Total",
      hash: "total_inc_tax",
      render: function ({ total_inc_tax, currency_code }) {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currency_code,
        }).format(total_inc_tax);
      },
    },
    {
      header: "Order Status",
      hash: "order_status",
      render: function (data) {
        let color;
        if (data.status_id === 5) {
          color = "danger";
        } else if (data.status_id === 2 || data.status_id === 10) {
          color = "success";
        } else {
          color = "secondary";
        }

        return <Text color={color}>{data.status}</Text>;
      },
    },
    {
      header: "Actions",
      hash: "actions",
      render: function (data) {
        if (data.status_id !== 5) {
          return (
            <Button
              actionType="destructive"
              onClick={(e) => cancelOrder(data.id, e)}
            >
              Cancel
            </Button>
          );
        }
      },
    },
  ];

  const handleOrdersResponse = (ordersData) => {
    setLoading(false);
    setOrders(ordersData);
  };

  const loadOrders = async () => {
    const { data: ordersData } = await ApiService.getOrders({
      limit: 5,
    });
    handleOrdersResponse(ordersData);
  };

  const hasOrders = () => {
    return orders.length > 0;
  };

  const cancelOrder = async (orderId) => {
    const newOrderData = { status_id: 5 };

    setLoading(true);
    await ApiService.updateOrder(orderId, newOrderData);
    loadOrders();
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([5, 10, 20, 30]);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentItems, setCurrentItems] = useState([]);

  const onItemsPerPageChange = (newRange) => {
    setCurrentPage(1);
    setItemsPerPage(newRange);
  };

  useEffect(() => {
    const maxItems = currentPage * itemsPerPage;
    const lastItem = Math.min(maxItems, orders.length);
    const firstItem = Math.max(0, maxItems - itemsPerPage);

    setCurrentItems(orders.slice(firstItem, lastItem));
  }, [currentPage, itemsPerPage]);

  return (
    <Panel header="Orders">
      {loading ? (
        <ProgressBar />
      ) : hasOrders() ? (
        <Table
          keyField="id"
          columns={tableHeaders}
          items={orders}
          itemName="Orders"
          stickyHeader
          pagination={{
            currentPage,
            totalItems: orders.length,
            onPageChange: setCurrentPage,
            itemsPerPageOptions,
            onItemsPerPageChange,
            itemsPerPage,
          }}
        />
      ) : (
        <Text bold={true}>No orders exist yet!</Text>
      )}
    </Panel>
  );
};

export default List;
