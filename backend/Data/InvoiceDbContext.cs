using Microsoft.EntityFrameworkCore;

public class InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : DbContext(options) { }
