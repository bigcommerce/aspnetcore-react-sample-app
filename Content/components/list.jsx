import React, { useState, useEffect } from "react";
import {
  ProgressBar,
  Button,
  Text,
  Table,
  Panel,
  Badge,
  Link,
} from "@bigcommerce/big-design";
import { ApiService } from "../services/apiService";

let controlPanelBaseUrl;

const List = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [controlPanelBaseUrl, setControlPanelBaseUrl] = useState(null);

  const getVariant = (statusId) => {
    // see https://developer.bigcommerce.com/api-reference/store-management/orders/order-status/getorderstatus
    const ids = {
      success: [2, 10],
      warning: [0, 3, 12, 13, 14],
      danger: [4, 5, 6],
    };
    if (ids.danger.includes(statusId)) {
      return "danger";
    } else if (ids.success.includes(statusId)) {
      return "success";
    } else if (ids.warning.includes(statusId)) {
      return "warning";
    }
    return "secondary";
  };
  const tableHeaders = [
    {
      header: "Order ID",
      hash: "id",
      render: ({ id }) => (
        <Link href={`${controlPanelBaseUrl}/manage/orders/${id}`}>{id}</Link>
      ),
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
      render: function ({ status_id, status }) {
        return <Badge variant={getVariant(status_id)} label={status}></Badge>;
      },
    },
    {
      header: "Actions",
      hash: "actions",
      render: function ({ status_id, id }) {
        const variant = getVariant(status_id);
        if (variant !== "danger" && variant !== "success") {
          return (
            <Button
              actionType="destructive"
              onClick={(e) => cancelOrder(id, e)}
            >
              Cancel
            </Button>
          );
        }
        return <></>;
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

  useEffect(() => {
    const fetchControlPanelBaseUrl = async () => {
      const { data } = await ApiService.getResourceEntry("v2/store");
      setControlPanelBaseUrl(data.control_panel_base_url);
    };
    fetchControlPanelBaseUrl();
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
