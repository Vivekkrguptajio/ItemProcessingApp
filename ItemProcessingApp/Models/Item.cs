namespace Assignment.Models
{
    public class Item
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Weight { get; set; }
        public string Status { get; set; } // "unprocessed", "processed"
        public int? ParentId { get; set; }
    }
}
