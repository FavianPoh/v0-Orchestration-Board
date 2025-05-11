import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const sensitivityResults = [
  {
    parameter: "GDP Growth Rate",
    baseValue: "2.5%",
    minValue: "1.0%",
    maxValue: "4.0%",
    impact: "High",
    correlation: "+0.85",
  },
  {
    parameter: "Inflation Rate",
    baseValue: "3.2%",
    minValue: "2.0%",
    maxValue: "5.0%",
    impact: "Medium",
    correlation: "-0.62",
  },
  {
    parameter: "Interest Rate",
    baseValue: "4.5%",
    minValue: "3.0%",
    maxValue: "6.0%",
    impact: "High",
    correlation: "-0.78",
  },
  {
    parameter: "Unemployment Rate",
    baseValue: "5.8%",
    minValue: "4.5%",
    maxValue: "7.5%",
    impact: "Medium",
    correlation: "-0.55",
  },
  {
    parameter: "Market Volatility",
    baseValue: "15.0%",
    minValue: "10.0%",
    maxValue: "25.0%",
    impact: "Low",
    correlation: "+0.32",
  },
]

export function SensitivityResults() {
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "High":
        return <Badge className="bg-red-500">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "Low":
        return <Badge className="bg-green-500">Low</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  const getCorrelationColor = (correlation: string) => {
    const value = Number.parseFloat(correlation)
    if (value > 0) {
      return "text-green-600"
    } else if (value < 0) {
      return "text-red-600"
    }
    return ""
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parameter</TableHead>
          <TableHead>Base Value</TableHead>
          <TableHead>Min Value</TableHead>
          <TableHead>Max Value</TableHead>
          <TableHead>Impact</TableHead>
          <TableHead>Correlation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sensitivityResults.map((result) => (
          <TableRow key={result.parameter}>
            <TableCell className="font-medium">{result.parameter}</TableCell>
            <TableCell>{result.baseValue}</TableCell>
            <TableCell>{result.minValue}</TableCell>
            <TableCell>{result.maxValue}</TableCell>
            <TableCell>{getImpactBadge(result.impact)}</TableCell>
            <TableCell className={getCorrelationColor(result.correlation)}>{result.correlation}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
