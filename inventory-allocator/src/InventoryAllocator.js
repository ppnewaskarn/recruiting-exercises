
// Common function to define a user 
// exception
function UserException(message) {
   this.message = message;
   this.name = 'UserException';
}

// InventoryAllocator Class
class InventoryAllocator {
    
    // Recursive function to find the first shipment combination that 
    // satisfies the order
    static _AttemptShipment(orders,inventoryList,totalShipments,warehouseUsed)
    {
    	var totalOrderItems = 0; 
    	for (var order in orders) 
    	{
            totalOrderItems += orders[order];
        }

        // if we are doing more than 1 shipment, find the first warehouse 
        // that fits the critaria, e.g. if 2 shipments, find first warehouse 
        // that satisfies atleast half of the order. if 3 shipments 
        // we need to find a warehouse that fulfils atleast 1/3rd of the 
        // order. 

        var ordersToSatisfy = Math.floor(totalOrderItems/totalShipments); 

        for(var warehouse in inventoryList)
		{   
			if(warehouseUsed.has(warehouse))
			{
				continue; 
			}

        	var ordersRemaining = ordersToSatisfy; 
            var inventory = inventoryList[warehouse].inventory;
            var tempFulfillment = {};
            var remainingOrders = {}
            Object.assign(remainingOrders,orders);

            for (var order in orders) 
	    	{
	            if(inventory[order])
	            {
	            	var orderfilled = Math.min(inventory[order], orders[order]);
	            	if(orderfilled > 0)
	            	{
	            	   ordersRemaining -= orderfilled;
	            	   remainingOrders[order] = orders[order] - orderfilled;
                       tempFulfillment[order] = Math.min(inventory[order], orders[order]);
	            	}
	            }
			}
            
            // we have filled the current order and no more 
            // shipmemts are remaining, return 
            if(ordersRemaining <= 0 && totalShipments == 1)
            {
            	var currentFullfillment = {};
            	currentFullfillment[inventoryList[warehouse].name] = tempFulfillment; 
            	var result = []; 
            	result.push(currentFullfillment)
            	return result;
            }
            // we have fulfilled the current order but we have 
            // more shipments so that means we need to fulfill 
            // more orders
            else if(ordersRemaining <= 0 && totalShipments > 1)
            {
               var currentFullfillment = {};
               currentFullfillment[inventoryList[warehouse].name] = tempFulfillment; 
               // add current warehouse to the warehouse used list so that the next 
               // recursive attempt ignores it. 
               warehouseUsed.add(warehouse);
               // Decriment the shipment number and try to satisfy the remaining orders
               var result = this._AttemptShipment(remainingOrders,inventoryList,totalShipments-1,warehouseUsed);
               if(result)
               {
               	 result.push(currentFullfillment);
                 return result;
               }
               else
               {  
                  // This combination did not work for us 
                  // So we start again. 
               	  warehouseUsed.delete(warehouse);
               }
            }
        }

        // we went through all the warehouses and were unable to find
        // a way to fulfill current order. 
        return false;
    }

    // Function to validate order input
    // Not using jsonschema to do this 
    // because I want to avoid using external 
    // packages, and keep it simple  
    static _ValidateOrders(orders)
    {
        // if it is an array
    	if(Array.isArray(orders))
		{
			throw new UserException("Invalid Order Input");
		}

		for (var order in orders) 
    	{   
            // if order count is not a number
            if(! (typeof orders[order] == "number"))
            {
            	throw new UserException("Invalid Order Input");
            }
        }
    }

    // Function to validate the inventory input. 
    // Not using jsonschema to do this 
    // because I want to avoid using external 
    // packages, and keep it simple
    static _ValidateInventory(inventoryList)
    {
        // inventory list should be an array. 
		if(!Array.isArray(inventoryList))
		{
			throw new UserException("Invalid Inventory List");
		}
        
		for(var warehouse in inventoryList)
		{
            // validate name and inventory
			if((typeof inventoryList[warehouse].name != "string") || 
				typeof inventoryList[warehouse].inventory != "object" || 
				Array.isArray(inventoryList[warehouse].inventory))
            {
            	throw new UserException("Invalid Inventory List");
            }

			for (var item in inventoryList[warehouse].inventory) 
	    	{
                 // inventory count should be a number
	    		 if(! (typeof inventoryList[warehouse].inventory[item] == "number"))
	    		 {
	    		 	throw new UserException("Invalid Inventory List");
	    		 }
			}
	    }

    }

    // Public function for the Inventory allocator. 
    // The primary logic here is to try to attempt 
    // multiple shipping options starting with 
    // Attempt to ship from only one warehouse
    // If that is not possible split it into 2 warehouse
    // and then 3 and so on upto the total number of 
    // warehouses.  
    static FindCheapestShipment (sOrders,sInventoryList) 
    {
        var response = {};
        response["status"] = "success";
        response["result"] = [];
        try
        {
            var orders = JSON.parse(sOrders);
            var inventoryList = JSON.parse(sInventoryList);

            this._ValidateOrders(orders);
            this._ValidateInventory(inventoryList);

            var maxShipments = inventoryList.length;
            
            for(var i = 1; i <= maxShipments; i++)
            {
                var result = this._AttemptShipment(orders,inventoryList,i,new Set([]));
                if(result)
                {
                	response["result"] = result;
                	break;
                }
            }

            return response;
        }
        catch(err)
        {
        	response["status"] = "error";
        	response["message"] = err.message;
        }

        return response;
    }
    
}

module.exports = InventoryAllocator;
