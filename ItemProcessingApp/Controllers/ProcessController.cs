using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data;
using Assignment.Models;

namespace Assignment.Controllers
{
    public class ProcessController : Controller
    {
        private readonly string _connectionString;

        public ProcessController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult ProcessItem()
        {
            return View();
        }

        [HttpPost]
        public IActionResult ProcessItem(int parentId, List<int> childIds)
        {
            try
            {
                if (childIds == null) childIds = new List<int>();

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    // Mark parent as processed
                    string updateSql = "UPDATE Items SET Status='processed' WHERE Id=@Id";
                    using (SqlCommand cmd = new SqlCommand(updateSql, conn))
                    {
                        cmd.Parameters.AddWithValue("@Id", parentId);
                        cmd.ExecuteNonQuery();
                    }

                    // Link children to parent
                    int updatedChildren = 0;
                    foreach (var childId in childIds)
                    {
                        string linkSql = "UPDATE Items SET ParentId=@ParentId WHERE Id=@ChildId";
                        using (SqlCommand cmd = new SqlCommand(linkSql, conn))
                        {
                            cmd.Parameters.AddWithValue("@ParentId", parentId);
                            cmd.Parameters.AddWithValue("@ChildId", childId);
                            updatedChildren += cmd.ExecuteNonQuery();
                        }
                    }
                    return Json(new { success = true, message = $"Linked {updatedChildren} children.", parentId, childIds });
                }
            }
            catch (System.Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet]
        public IActionResult TreeView()
        {
            List<object> treeData = new List<object>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string sql = "SELECT * FROM Items";
                SqlCommand cmd = new SqlCommand(sql, conn);
                conn.Open();
                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        bool hasParent = dr["ParentId"] != DBNull.Value;
                        string status = dr["Status"].ToString();
                        string badge = hasParent ? "child" : status;

                        treeData.Add(new
                        {
                            id = Convert.ToInt32(dr["Id"]),
                            parent = hasParent ? Convert.ToInt32(dr["ParentId"]) : (int?)null,
                            text = dr["Name"].ToString(),
                            weight = Convert.ToDecimal(dr["Weight"]),
                            status = badge,
                            itemStatus = status
                        });
                    }
                }
            }
            return Json(new { success = true, data = treeData });
        }

        [HttpGet]
        public IActionResult ProcessedList()
        {
            try
            {
                var processedData = new List<object>();
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    string sql = "SELECT * FROM Items";
                    SqlCommand cmd = new SqlCommand(sql, conn);
                    conn.Open();

                    var parentToChildren = new Dictionary<int, List<Item>>();
                    var parents = new List<Item>();

                    using (SqlDataReader dr = cmd.ExecuteReader())
                    {
                        while (dr.Read())
                        {
                            var item = new Item
                            {
                                Id = Convert.ToInt32(dr["Id"]),
                                Name = dr["Name"].ToString(),
                                Weight = Convert.ToDecimal(dr["Weight"]),
                                Status = dr["Status"].ToString(),
                                ParentId = dr["ParentId"] == DBNull.Value ? (int?)null : Convert.ToInt32(dr["ParentId"])
                            };

                            if (item.Status == "processed")
                            {
                                parents.Add(item);
                            }

                            if (item.ParentId.HasValue)
                            {
                                if (!parentToChildren.ContainsKey(item.ParentId.Value))
                                    parentToChildren[item.ParentId.Value] = new List<Item>();

                                parentToChildren[item.ParentId.Value].Add(item);
                            }
                        }
                    }

                    foreach (var p in parents)
                    {
                        var childrenList = parentToChildren.ContainsKey(p.Id) ? parentToChildren[p.Id] : new List<Item>();
                        decimal totalWeight = 0;
                        List<string> childNames = new List<string>();
                        foreach (var c in childrenList)
                        {
                            totalWeight += c.Weight;
                            childNames.Add(c.Name);
                        }

                        processedData.Add(new
                        {
                            Id = p.Id,
                            ParentName = p.Name,
                            ParentWeight = p.Weight,
                            ChildItems = string.Join(", ", childNames),
                            TotalChildWeight = totalWeight
                        });
                    }
                }
                return Json(new { success = true, data = processedData });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
