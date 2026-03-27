using System.Collections.Generic;

namespace Assignment.Models
{
    public class ProcessedItem
    {
        public int Id { get; set; }
        public Item Parent { get; set; }
        public List<Item> Children { get; set; } = new List<Item>();
        public decimal TotalChildWeight { get; set; }
    }
}
