using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

public class AccountController : Controller
{
    private readonly IConfiguration _config;

    public AccountController(IConfiguration config)
    {
        _config = config;
    }

    public IActionResult Login()
    {
        return View();
    }

    [HttpPost]
    public IActionResult Login(LoginViewModel model)
    {
        string connStr = _config.GetConnectionString("DefaultConnection");

        using (SqlConnection conn = new SqlConnection(connStr))
        {
            conn.Open();

            string query = "SELECT COUNT(*) FROM Users WHERE Email=@Email AND Password=@Password";

            SqlCommand cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@Email", model.Email);
            cmd.Parameters.AddWithValue("@Password", model.Password);

            int count = (int)cmd.ExecuteScalar();

            if (count > 0)
            {
                return RedirectToAction("Index", "Home");
            }
            else
            {
                ViewBag.Error = "Invalid login";
                return View();
            }
        }
    }

    public IActionResult Logout()
    {
        return RedirectToAction("Login");
    }
}