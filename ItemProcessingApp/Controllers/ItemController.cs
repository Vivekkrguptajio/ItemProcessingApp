using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data;
using Assignment.Models; // For the Item model

namespace Assignment.Controllers
{
    public class ItemController : Controller
    {
        private readonly string _connectionString;

        public ItemController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult Index()
        {
            List<object> items = new List<object>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string sql = "SELECT * FROM Items";
                SqlCommand cmd = new SqlCommand(sql, conn);
                conn.Open();
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        items.Add(new
                        {
                            id = dr["Id"],
                            name = dr["Name"],
                            weight = dr["Weight"],
                            status = dr["Status"],
                            parentId = dr["ParentId"] == DBNull.Value ? null : dr["ParentId"]
                        });
                    }
                }
            }
            return Json(items);
        }

        [HttpPost]
        public IActionResult Add(string itemName, decimal weight)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    string sql = "INSERT INTO Items (Name, Weight, Status) VALUES (@Name, @Weight, 'unprocessed'); SELECT SCOPE_IDENTITY();";
                    SqlCommand cmd = new SqlCommand(sql, conn);
                    cmd.Parameters.AddWithValue("@Name", itemName);
                    cmd.Parameters.AddWithValue("@Weight", weight);
                    conn.Open();
                    object result = cmd.ExecuteScalar();
                    int newId = Convert.ToInt32(result);
                    return Json(new { success = true, Id = newId, message = "Item added!" });
                }
            }
            catch (System.Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost]
        public IActionResult Edit(int id, string itemName, decimal weight)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    string sql = "UPDATE Items SET Name=@Name, Weight=@Weight WHERE Id=@Id";
                    SqlCommand cmd = new SqlCommand(sql, conn);
                    cmd.Parameters.AddWithValue("@Id", id);
                    cmd.Parameters.AddWithValue("@Name", itemName);
                    cmd.Parameters.AddWithValue("@Weight", weight);
                    conn.Open();
                    cmd.ExecuteNonQuery();
                }
                return Json(new { success = true, message = "Item updated!" });
            }
            catch (System.Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost]
        public IActionResult Delete(int id)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    // First unlink any children
                    string unlinkSql = "UPDATE Items SET ParentId=NULL WHERE ParentId=@Id";
                    using (SqlCommand unlinkCmd = new SqlCommand(unlinkSql, conn))
                    {
                        unlinkCmd.Parameters.AddWithValue("@Id", id);
                        unlinkCmd.ExecuteNonQuery();
                    }
                    // Then delete the item
                    string sql = "DELETE FROM Items WHERE Id=@Id";
                    SqlCommand cmd = new SqlCommand(sql, conn);
                    cmd.Parameters.AddWithValue("@Id", id);
                    cmd.ExecuteNonQuery();
                }
                return Json(new { success = true, message = "Item deleted." });
            }
            catch (System.Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }

        public IActionResult Search(string query)
        {
            List<object> results = new List<object>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string sql = "SELECT * FROM Items WHERE Name LIKE @Query";
                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@Query", "%" + query + "%");
                conn.Open();
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        results.Add(new
                        {
                            id = dr["Id"],
                            name = dr["Name"],
                            weight = dr["Weight"],
                            status = dr["Status"],
                            parentId = dr["ParentId"] == DBNull.Value ? null : dr["ParentId"]
                        });
                    }
                }
            }
            return Json(new { success = true, results = results });
        }
    }
}
