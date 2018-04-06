// include for assert functionality
var Assert = require('assert');
// include Inventory Allocator
var InventoryAllocator = require("./InventoryAllocator");

// Test counters. 
var numTests = 0; 
var numTestPassed = 0;

// Common function to validate the test results. 
function ValidateInventoryAllocatorTestResult(result,expectedStatus,expectedOutput)
{
   numTests++;
   
   try
   {
       Assert.equal(result["status"],expectedStatus);
       if(expectedStatus == "success")
       {
          var op = result["result"];
          Assert.equal(op.length,expectedOutput.length);
          
          for(var i = 0; i < op.length; i++)
          {
              expectedWarehouse = expectedOutput.find(function(e){ return Object.keys(e)[0] == Object.keys(op[i])[0]});
              currentWarehouse = op[i];
              Assert.deepEqual(expectedWarehouse,currentWarehouse);
          }
       }

       console.log("Test Result:","\x1b[32m","Passed","\x1b[0m","\n");
       numTestPassed++;
   }
   catch(err)
   {
      console.log("Test Result:","\x1b[31m","Failed",err.message,"\x1b[0m","\n");
   }
}

// Test runner function
function RunInventoryAllocatorTest(inventory,order,expectedStatus,expectedOutput)
{
   var response = InventoryAllocator.FindCheapestShipment(order,inventory); 
   console.log("Inventory:",inventory)
   console.log("Order:",order);
   console.log("Result:",JSON.stringify(response));
   ValidateInventoryAllocatorTestResult(response,expectedStatus,expectedOutput);
}


/*Begin Test cases*/

// test null input
var inventory = '';
var order = '';
RunInventoryAllocatorTest(null,null,"error",null);

// test empty input
var inventory = '';
var order = '';
RunInventoryAllocatorTest(inventory,order,"error",null);

// test empty inventory
inventory = '';
order = '{"apple":4}';
RunInventoryAllocatorTest(inventory,order,"error",null);

// test invalid order 1
inventory = '[{"name":"owd","inventory":{"apple":4,"orange":10}}]';
order = '{"apple":"raw"}';
RunInventoryAllocatorTest(inventory,order,"error",null);

// test invalid inventory 
inventory = '{}';
order = '{"apple":5}';
RunInventoryAllocatorTest(inventory,order,"error",null);

// test invalid order 2
inventory = '[{"owd":{"apple":4,"orange":1}},{"dm":{"banana":5}}]';
order = '[]';
RunInventoryAllocatorTest(inventory,order,"error",null);

// test invalid inventory 
inventory = '[{"owd":{"apple":"foo"}}]';
order = '{"apple":5}';
RunInventoryAllocatorTest(inventory,order,"error",null);

// Happy Case, exact inventory match
inventory = '[{"name": "owd","inventory": { "apple": 1 } }]';
order = '{"apple": 1 }';
RunInventoryAllocatorTest(inventory,order,"success",[{ owd: { apple: 1 } }]);

// Exact inventory match with multiple inventory first ware house is a match
inventory = '[{"name": "owd","inventory": { "apple": 1 } },{"name": "owd1","inventory": { "apple": 1 } },{"name": "owd2","inventory": { "apple": 1 } }]';
order = '{"apple": 1 }';
RunInventoryAllocatorTest(inventory,order,"success",[{ owd: { apple: 1 } }]);

// Exact inventory match with multiple inventory middle warehouse is a match
inventory = '[{"name": "owd","inventory": { "apple": 1 } },{"name": "owd1","inventory": { "apple": 2 } },{"name": "owd2","inventory": { "apple": 1 } }]';
order = '{"apple": 2 }';
RunInventoryAllocatorTest(inventory,order,"success",[{ owd1: { apple: 2 } }]);

// Exact inventory match with multiple inventory last warehouse is a match
inventory = '[{"name": "owd","inventory": { "apple": 1 } },{"name": "owd1","inventory": { "apple": 2 } },{"name": "owd2","inventory": { "apple": 3 } }]';
order = '{"apple": 3 }';
RunInventoryAllocatorTest(inventory,order,"success",[{ owd2: { apple: 3 } }]);

// Test Not enough inventory -> no allocations!
inventory = '[{"name": "owd","inventory": { "apple": 0 } }]';
order = '{"apple": 1 }';
RunInventoryAllocatorTest(inventory,order,"success",[]);

// Test basic split 
inventory = '[{ "name": "owd", "inventory": { "apple": 5 } }, { "name": "dm", "inventory": { "apple": 5 }}]';
order = '{"apple": 10 }';
RunInventoryAllocatorTest(inventory,order,"success",[{ dm: { apple: 5 }}, { owd: { apple: 5 } }]);

// Test split complex (first two are expected output)
inventory = '[{"name":"owd","inventory":{"apple":5,"orange":10}},{"name":"dm","inventory":{"banana": 5,"orange":10}},{"name":"lm","inventory":{"apple": 5, "orange": 10 }}]'; 
order = '{"apple":5,"banana":5,"orange":5}';
RunInventoryAllocatorTest(inventory,order,"success",[{owd:{apple:5,orange:5}},{dm:{banana:5}}]);

// Test split complex (last two are expected output)
inventory = '[{"name":"owd","inventory":{"apple":4,"orange":10}},{"name":"dm","inventory":{"banana": 5,"orange":10}},{"name":"lm","inventory":{"apple": 5, "orange": 10 }}]'; 
order = '{"apple":5,"banana":5,"orange":5}';
RunInventoryAllocatorTest(inventory,order,"success",[{lm:{apple:5}},{dm:{banana:5, orange:5}}]);


// Test 2-ways split complex (Multiple combinations exisis but the most efficient is picked distance wise) type 1
inventory = '[{"name":"owd","inventory":{"apple":5,"orange":4}},'+
             '{"name":"dm","inventory":{"banana":5,"orange":4}},'+
             '{"name":"lm","inventory":{"banana":5,"orange":6 }},'+
             '{"name":"km","inventory":{"apple":5,"orange":6 }}]'; 
order = '{"apple":5,"banana":5,"orange":10}';

// Test 2-ways split complex (Multiple combinations exisis but the most efficient is picked distance wise) type 2 
inventory = '[{"name":"owd","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"dm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"lm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"km","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"vm","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"hm","inventory":{"apple":5,"orange":5,"kiwi":5}}]';

order = '{"apple":5,"banana":5,"orange":10,"kiwi":5}';
RunInventoryAllocatorTest(inventory,order,"success",[{dm:{banana:5,orange:5}},{owd:{apple:5,orange:5,kiwi:5}}]);

// Test 2-ways split complex (Multiple combinations exisis but the most efficient is picked distance wise) type 3 
inventory = '[{"name":"owd","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"dm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"lm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"km","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"vm","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"hm","inventory":{"apple":5,"orange":5,"kiwi":5}}]';

order = '{"apple":5,"banana":5,"orange":5,"kiwi":10}';
RunInventoryAllocatorTest(inventory,order,"success",[{dm:{banana:5,kiwi:5}},{owd:{apple:5,orange:5,kiwi:5}}]);

// Test 3-ways split complex (Multiple combinations exisis but the most efficient is picked distance wise) type 1 
inventory = '[{"name":"owd","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"dm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"lm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"km","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"vm","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"hm","inventory":{"apple":5,"orange":5,"kiwi":5}}]';

order = '{"apple":10,"banana":5,"orange":5,"kiwi":5}';
RunInventoryAllocatorTest(inventory,order,"success",[{km:{apple:5}},{dm:{banana:5}},{owd:{apple:5,orange:5,kiwi:5}}]);

// Test 3-ways split complex (Multiple combinations exisis but the most efficient is picked distance wise) type 2 
inventory = '[{"name":"owd","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"dm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"lm","inventory":{"banana":5,"orange":5,"kiwi":5}},'+
             '{"name":"km","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"vm","inventory":{"apple":5,"orange":5,"kiwi":5}},'+
             '{"name":"hm","inventory":{"apple":5,"orange":5,"kiwi":5}}]';

order = '{"apple":5,"banana":10,"orange":5,"kiwi":5}';
RunInventoryAllocatorTest(inventory,order,"success",[{lm:{banana:5}},{dm:{banana:5}},{owd:{apple:5,orange:5,kiwi:5}}]);

console.log("Number of tests run:",numTests,"\x1b[32m","Passed:",numTestPassed,"\x1b[31m","Failed:",numTests-numTestPassed,"\x1b[0m");