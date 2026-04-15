using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

// ============================================================
// أضف هذا الكود في LaundryAdminController.cs
// بعد GetServices method (حوالي line 105)
// ============================================================

/// <summary>
/// GET /api/laundry-admin/dashboard
/// بيجيب إحصائيات الداشبورد للمغسلة
/// </summary>
[HttpGet("dashboard")]
public async Task<IActionResult> GetDashboard()
{
    try
    {
        var adminId = GetAdminId();
        
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        // Get the laundry for this admin
        var laundry = await _dbContext.Laundries
            .FirstOrDefaultAsync(l => l.OwnerId == adminId);

        if (laundry == null)
        {
            // Return empty data instead of error - user hasn't setup laundry yet
            return Ok(new
            {
                totalRevenue = 0,
                totalOrders = 0,
                completedOrders = 0,
                pendingOrders = 0,
                deliveredOrders = 0,
                message = "No laundry found for this user. Please complete setup."
            });
        }

        // Get orders statistics
        var orders = await _dbContext.Orders
            .Where(o => o.LaundryId == laundry.Id)
            .ToListAsync();

        var totalRevenue = orders.Sum(o => o.TotalPrice);
        var totalOrders = orders.Count;
        var completedOrders = orders.Count(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Completed);
        var pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Processing);
        var deliveredOrders = completedOrders;

        return Ok(new
        {
            totalRevenue,
            totalOrders,
            completedOrders,
            pendingOrders,
            deliveredOrders
        });
    }
    catch (Exception ex)
    {
        // Log the full error
        Console.WriteLine($"[Dashboard Error] {DateTime.Now}: {ex.Message}");
        Console.WriteLine($"[Dashboard Error] Stack: {ex.StackTrace}");
        
        if (ex.InnerException != null)
        {
            Console.WriteLine($"[Dashboard Error] Inner: {ex.InnerException.Message}");
        }
        
        return StatusCode(500, new 
        { 
            message = "Internal server error", 
            error = ex.Message,
            details = ex.InnerException?.Message 
        });
    }
}

// ============================================================
// Optional: Add these helper endpoints too
// ============================================================

/// <summary>
/// GET /api/laundry-admin/orders/incoming
/// بيجيب آخر الطلبات الواردة
/// </summary>
[HttpGet("orders/incoming")]
public async Task<IActionResult> GetIncomingOrders()
{
    try
    {
        var adminId = GetAdminId();
        var laundry = await _dbContext.Laundries
            .FirstOrDefaultAsync(l => l.OwnerId == adminId);

        if (laundry == null)
        {
            return Ok(new List<object>()); // Return empty list
        }

        var orders = await _dbContext.Orders
            .Where(o => o.LaundryId == laundry.Id)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new {
                id = o.Id,
                orderNumber = $"ORD-{o.Id.ToString().Substring(0, 6)}",
                customerName = o.Customer.Name,
                serviceName = o.Service.Name,
                items = o.Items.Count,
                total = o.TotalPrice,
                status = o.Status.ToString(),
                createdAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Orders Error]: {ex.Message}");
        return StatusCode(500, new { message = ex.Message });
    }
}

/// <summary>
/// GET /api/laundry-admin/revenue/monthly
/// بيجيب إحصائيات الإيرادات الشهرية
/// </summary>
[HttpGet("revenue/monthly")]
public async Task<IActionResult> GetRevenueMonthly()
{
    try
    {
        var adminId = GetAdminId();
        var laundry = await _dbContext.Laundries
            .FirstOrDefaultAsync(l => l.OwnerId == adminId);

        if (laundry == null)
        {
            return Ok(new List<object>());
        }

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        
        var revenue = await _dbContext.Orders
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
        Console.WriteLine($"[Revenue Error]: {ex.Message}");
        return StatusCode(500, new { message = ex.Message });
    }
}
