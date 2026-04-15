// ============================================================
// Backend APIs - نسخة مبسطة وآمنة
// ضيفهم في LaundryAdminController.cs
// ============================================================

[HttpGet("dashboard")]
public async Task<IActionResult> GetDashboard()
{
    try
    {
        // Get current user ID from JWT token
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Ok(new { totalRevenue = 0, totalOrders = 0, completedOrders = 0, pendingOrders = 0, error = "Not logged in" });
        }

        // Try to find user's laundry
        var laundry = await _dbContext.Laundries
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.OwnerId == userId);

        if (laundry == null)
        {
            // User has no laundry yet - return zeros
            return Ok(new { 
                totalRevenue = 0, 
                totalOrders = 0, 
                completedOrders = 0, 
                pendingOrders = 0,
                deliveredOrders = 0
            });
        }

        // Get orders for this laundry
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(o => o.LaundryId == laundry.Id)
            .ToListAsync();

        var totalRevenue = orders.Sum(o => o.TotalPrice);
        var totalOrders = orders.Count;
        var completedOrders = orders.Count(o => o.Status == OrderStatus.Delivered || o.Status.ToString() == "Delivered");
        var pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending || o.Status.ToString() == "Pending");

        return Ok(new
        {
            totalRevenue,
            totalOrders,
            completedOrders,
            pendingOrders,
            deliveredOrders = completedOrders
        });
    }
    catch (Exception ex)
    {
        // Log full error
        Console.WriteLine($"[ERROR] Dashboard: {ex.GetType().Name}: {ex.Message}");
        Console.WriteLine($"[ERROR] Stack: {ex.StackTrace}");
        
        // Return error details in response
        return StatusCode(500, new { 
            error = ex.Message,
            type = ex.GetType().Name,
            stack = ex.StackTrace?.Substring(0, 200)
        });
    }
}

[HttpGet("orders/incoming")]
public async Task<IActionResult> GetIncomingOrders()
{
    try
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
            return Ok(new List<object>());

        var laundry = await _dbContext.Laundries
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.OwnerId == userId);

        if (laundry == null)
            return Ok(new List<object>());

        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(o => o.LaundryId == laundry.Id)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new {
                id = o.Id,
                orderNumber = o.Id.ToString(),
                customerName = "Customer", // Simplified - add join if needed
                serviceName = "Service",
                items = 1,
                total = o.TotalPrice,
                status = o.Status.ToString(),
                createdAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] Orders: {ex.Message}");
        return StatusCode(500, new { error = ex.Message });
    }
}

[HttpGet("revenue/monthly")]
public async Task<IActionResult> GetRevenueMonthly()
{
    try
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
            return Ok(new List<object>());

        var laundry = await _dbContext.Laundries
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.OwnerId == userId);

        if (laundry == null)
            return Ok(new List<object>());

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        
        // If no orders, return empty
        var hasOrders = await _dbContext.Orders
            .AnyAsync(o => o.LaundryId == laundry.Id);
            
        if (!hasOrders)
            return Ok(new List<object>());

        var revenue = await _dbContext.Orders
            .AsNoTracking()
            .Where(o => o.LaundryId == laundry.Id && o.CreatedAt >= sixMonthsAgo)
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => new {
                month = $"{g.Key.Year}-{g.Key.Month:D2}",
                revenue = g.Sum(o => o.TotalPrice),
                orders = g.Count()
            })
            .OrderBy(r => r.month)
            .ToListAsync();

        return Ok(revenue);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] Revenue: {ex.Message}");
        return StatusCode(500, new { error = ex.Message });
    }
}
