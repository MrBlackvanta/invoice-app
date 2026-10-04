using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class MoveToOwnSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "invoice");

            migrationBuilder.RenameTable(
                name: "invoices",
                newName: "invoices",
                newSchema: "invoice"
            );

            migrationBuilder.RenameTable(
                name: "invoice_items",
                newName: "invoice_items",
                newSchema: "invoice"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(name: "invoices", schema: "invoice", newName: "invoices");

            migrationBuilder.RenameTable(
                name: "invoice_items",
                schema: "invoice",
                newName: "invoice_items"
            );
        }
    }
}
