import java.util.Scanner;
import java.util.Arrays;

public class Testing {

    // Function to perform left rotations on the array
    public static int[] rotLeft(int[] a, int d) {
        int n = a.length;
        // Create a new array to store the rotated values
        int[] rotatedArray = new int[n];

        // Copy the elements from the original array to their new positions
        for (int i = 0; i < n; i++) {
            rotatedArray[(i + n - d) % n] = a[i];
        }

        return rotatedArray;
    }

    // Main method to test the rotLeft function
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Input the number of elements in the array
        System.out.print("Enter the number of elements in the array: ");
        int n = scanner.nextInt();

        // Input the number of rotations to be performed
        System.out.print("Enter the number of left rotations: ");
        int d = scanner.nextInt();

        // Initialize the array
        int[] array = new int[n];

        // Input the elements of the array
        System.out.println("Enter the elements of the array:");
        for (int i = 0; i < n; i++) {
            array[i] = scanner.nextInt();
        }

        // Perform the left rotations
        int[] result = rotLeft(array, d);

        // Print the resulting array
        System.out.println("The array after " + d + " left rotations is:");
        System.out.println(Arrays.toString(result));

        scanner.close();
    }
}